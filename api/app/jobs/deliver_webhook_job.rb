class DeliverWebhookJob < ApplicationJob
  queue_as :webhooks

  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(subscription_id, event_type, payload)
    subscription = WebhookSubscription.find_by(id: subscription_id)
    return unless subscription&.is_active?

    timestamp = Time.current.to_i
    body = {
      event: event_type,
      data: payload,
      timestamp: timestamp,
      id: SecureRandom.uuid
    }.to_json

    signature = compute_signature(body, subscription.signing_key, timestamp)

    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    response = Net::HTTP.post(
      URI(subscription.url),
      body,
      {
        'Content-Type' => 'application/json',
        'X-OpenFinance-Signature' => signature,
        'X-OpenFinance-Timestamp' => timestamp.to_s,
        'X-OpenFinance-Event' => event_type,
        'User-Agent' => 'OpenFinance-Webhooks/1.0'
      }
    )

    duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round

    delivery = subscription.webhook_deliveries.create!(
      event_type: event_type,
      payload: payload,
      response_code: response.code.to_i,
      response_body: response.body&.truncate(1000),
      success: response.code.to_i.between?(200, 299),
      duration_ms: duration_ms,
      delivered_at: Time.current
    )

    if delivery.success?
      subscription.record_success!
    else
      subscription.record_failure!("HTTP #{response.code}")
    end
  rescue StandardError => e
    subscription&.record_failure!(e.message) if subscription
    raise # Let retry_on handle it
  end

  private

  def compute_signature(body, secret, timestamp)
    signed_payload = "#{timestamp}.#{body}"
    hmac = OpenSSL::HMAC.hexdigest('SHA256', secret, signed_payload)
    "v1=#{hmac}"
  end
end

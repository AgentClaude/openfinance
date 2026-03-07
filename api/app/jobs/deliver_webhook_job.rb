class DeliverWebhookJob < ApplicationJob
  queue_as :webhooks

  TIMEOUT_SECONDS = 10

  def perform(webhook_event_id)
    event = WebhookEvent.includes(:webhook_subscription).find_by(id: webhook_event_id)
    return unless event
    return unless event.webhook_subscription.active?

    subscription = event.webhook_subscription
    payload_json = event.payload.to_json
    signature = subscription.sign_payload(payload_json)

    uri = URI.parse(subscription.url)

    # Defense-in-depth: SSRF check at delivery time (prevents DNS rebinding)
    begin
      resolved_ip = IPAddr.new(Resolv.getaddress(uri.host))
      if resolved_ip.private? || resolved_ip.loopback? || resolved_ip.link_local?
        event.failed!(error_message: "SSRF blocked: resolved to internal address")
        return
      end
    rescue Resolv::ResolvError => e
      event.failed!(error_message: "DNS resolution failed: #{e.message}")
      subscription.record_failure!
      retry_delivery(event) if event.attempt < 3
      return
    rescue IPAddr::InvalidAddressError
      # Not a raw IP (e.g. IPv6 hostname) — allow through
    end

    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = TIMEOUT_SECONDS
    http.read_timeout = TIMEOUT_SECONDS

    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/json"
    request["X-Webhook-Signature"] = "sha256=#{signature}"
    request["X-Webhook-Event"] = event.event_type
    request["X-Webhook-Id"] = event.id
    request["User-Agent"] = "OpenFinance-Webhooks/1.0"
    request.body = payload_json

    response = http.request(request)
    elapsed_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

    if response.code.to_i.between?(200, 299)
      event.delivered!(
        status_code: response.code.to_i,
        response_body: response.body,
        response_time_ms: elapsed_ms
      )
      subscription.record_success!
    else
      event.failed!(
        error_message: "HTTP #{response.code}",
        status_code: response.code.to_i,
        response_body: response.body,
        response_time_ms: elapsed_ms
      )
      subscription.record_failure!
      retry_delivery(event) if event.attempt < 3
    end
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    handle_error(event, subscription, "Timeout: #{e.message}")
  rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
    handle_error(event, subscription, "Connection error: #{e.message}")
  rescue StandardError => e
    handle_error(event, subscription, "Error: #{e.message}")
  end

  private

  def handle_error(event, subscription, message)
    return unless event

    event.failed!(error_message: message)
    subscription&.record_failure!
    retry_delivery(event) if event.attempt < 3
  end

  def retry_delivery(event)
    next_attempt = event.attempt + 1
    new_event = WebhookEvent.create!(
      webhook_subscription: event.webhook_subscription,
      event_type: event.event_type,
      payload: event.payload,
      attempt: next_attempt
    )
    # Exponential backoff: 30s, 120s, 480s
    delay = (30 * (4**(next_attempt - 2))).seconds
    DeliverWebhookJob.set(wait: delay).perform_later(new_event.id)
  end
end

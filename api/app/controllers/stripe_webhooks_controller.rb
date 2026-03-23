class StripeWebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token, raise: false
  skip_before_action :authenticate_user!, raise: false

  def create
    payload = request.body.read
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    endpoint_secret = ENV['STRIPE_WEBHOOK_SECRET']

    begin
      event = if endpoint_secret.present?
        Stripe::Webhook.construct_event(payload, sig_header, endpoint_secret)
      else
        # Dev/test mode — parse without signature verification
        data = JSON.parse(payload, symbolize_names: true)
        Stripe::Event.construct_from(data)
      end
    rescue JSON::ParserError
      render json: { error: 'Invalid payload' }, status: :bad_request and return
    rescue Stripe::SignatureVerificationError
      render json: { error: 'Invalid signature' }, status: :bad_request and return
    end

    result = Subscriptions::WebhookService.call(event: event)

    if result.success?
      render json: { received: true }, status: :ok
    else
      Rails.logger.warn("Stripe webhook processing failed: #{result.error_message}")
      render json: { received: true }, status: :ok # Still return 200 to avoid retries
    end
  end
end

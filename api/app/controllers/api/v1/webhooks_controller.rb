module Api
  module V1
    class WebhooksController < BaseController
      def index
        subscriptions = current_user.webhook_subscriptions.order(created_at: :desc)

        result = subscriptions.map { |sub| serialize_subscription(sub) }

        render json: {
          webhooks: result,
          count: result.size,
          supported_events: WebhookSubscription::SUPPORTED_EVENTS
        }
      end

      def create
        subscription = current_user.webhook_subscriptions.build(webhook_params)

        if subscription.save
          render json: {
            webhook: serialize_subscription(subscription, include_secret: true),
            message: 'Webhook subscription created. Save the secret — it won\'t be shown again.'
          }, status: :created
        else
          render json: { error: 'Validation failed', details: subscription.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        subscription = current_user.webhook_subscriptions.find(params[:id])
        deliveries = subscription.webhook_deliveries.recent.map do |d|
          {
            id: d.id,
            event_type: d.event_type,
            response_code: d.response_code,
            success: d.success,
            duration_ms: d.duration_ms,
            delivered_at: d.delivered_at&.iso8601
          }
        end

        render json: {
          webhook: serialize_subscription(subscription),
          recent_deliveries: deliveries
        }
      end

      def update
        subscription = current_user.webhook_subscriptions.find(params[:id])

        if subscription.update(webhook_update_params)
          render json: { webhook: serialize_subscription(subscription) }
        else
          render json: { error: 'Validation failed', details: subscription.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        subscription = current_user.webhook_subscriptions.find(params[:id])
        subscription.destroy!
        render json: { success: true, message: 'Webhook subscription deleted' }
      end

      def test
        subscription = current_user.webhook_subscriptions.find(params[:id])

        DeliverWebhookJob.perform_later(
          subscription.id,
          'test.ping',
          { message: 'This is a test webhook delivery from OpenFinance' }
        )

        render json: { success: true, message: 'Test webhook queued for delivery' }
      end

      private

      def webhook_params
        params.permit(:url, events: [])
      end

      def webhook_update_params
        params.permit(:url, :is_active, events: [])
      end

      def serialize_subscription(sub, include_secret: false)
        data = {
          id: sub.id,
          url: sub.url,
          events: sub.events,
          is_active: sub.is_active,
          failure_count: sub.failure_count,
          last_triggered_at: sub.last_triggered_at&.iso8601,
          last_failed_at: sub.last_failed_at&.iso8601,
          last_error: sub.last_error,
          created_at: sub.created_at.iso8601
        }
        data[:secret] = sub.secret if include_secret
        data
      end
    end
  end
end

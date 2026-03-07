module Api
  module V1
    class WebhooksController < BaseController
      before_action :set_webhook, only: [:show, :update, :destroy, :test, :events]

      # GET /api/v1/webhooks
      def index
        webhooks = current_household.webhook_subscriptions
                                    .where(user: current_user)
                                    .order(created_at: :desc)

        render json: {
          webhooks: webhooks.map { |w| serialize_webhook(w) },
          count: webhooks.size
        }
      end

      # GET /api/v1/webhooks/:id
      def show
        render json: { webhook: serialize_webhook(@webhook, include_secret: true) }
      end

      # POST /api/v1/webhooks
      def create
        webhook = current_household.webhook_subscriptions.new(webhook_params)
        webhook.user = current_user

        if webhook.save
          render json: { webhook: serialize_webhook(webhook, include_secret: true) }, status: :created
        else
          render json: { errors: webhook.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/webhooks/:id
      def update
        if @webhook.update(webhook_update_params)
          render json: { webhook: serialize_webhook(@webhook) }
        else
          render json: { errors: @webhook.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/webhooks/:id
      def destroy
        @webhook.destroy!
        render json: { message: "Webhook deleted" }
      end

      # POST /api/v1/webhooks/:id/test
      def test
        event = WebhookEvent.create!(
          webhook_subscription: @webhook,
          event_type: @webhook.events.first || "transaction.created",
          payload: {
            id: SecureRandom.uuid,
            type: "test",
            created_at: Time.current.iso8601,
            data: { message: "This is a test webhook delivery from OpenFinance" }
          }
        )

        DeliverWebhookJob.perform_later(event.id)

        render json: { message: "Test webhook queued", event_id: event.id }
      end

      # GET /api/v1/webhooks/:id/events
      def events
        events = @webhook.webhook_events
                         .order(created_at: :desc)
                         .limit(params[:limit]&.to_i || 20)

        render json: {
          events: events.map { |e| serialize_event(e) },
          count: events.size
        }
      end

      private

      def set_webhook
        @webhook = current_household.webhook_subscriptions
                                    .where(user: current_user)
                                    .find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Webhook not found" }, status: :not_found
      end

      def webhook_params
        params.permit(:url, :name, events: [])
      end

      def webhook_update_params
        params.permit(:url, :name, :is_active, events: [])
      end

      def serialize_webhook(webhook, include_secret: false)
        data = {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          is_active: webhook.active?,
          failure_count: webhook.failure_count,
          last_triggered_at: webhook.last_triggered_at&.iso8601,
          created_at: webhook.created_at.iso8601,
          updated_at: webhook.updated_at.iso8601
        }
        data[:secret] = webhook.secret if include_secret
        data
      end

      def serialize_event(event)
        {
          id: event.id,
          event_type: event.event_type,
          delivery_status: event.delivery_status,
          status_code: event.status_code,
          response_time_ms: event.response_time_ms,
          attempt: event.attempt,
          error_message: event.error_message,
          delivered_at: event.delivered_at&.iso8601,
          created_at: event.created_at.iso8601
        }
      end
    end
  end
end

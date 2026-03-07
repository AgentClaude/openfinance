module Webhooks
  class PublishService < ApplicationService
    attr_accessor :household, :event_type, :data

    validates :household, :event_type, :data, presence: true

    def call
      return validation_failure(self) unless valid?
      return failure("Unsupported event type") unless WebhookSubscription::SUPPORTED_EVENTS.include?(event_type)

      subscriptions = WebhookSubscription.for_event(event_type)
                                         .where(household: household)

      return success(events_count: 0) if subscriptions.empty?

      events = subscriptions.map do |subscription|
        event = WebhookEvent.create!(
          webhook_subscription: subscription,
          event_type: event_type,
          payload: build_payload(subscription)
        )
        DeliverWebhookJob.perform_later(event.id)
        event
      end

      success(events_count: events.size)
    end

    private

    def build_payload(subscription)
      {
        id: SecureRandom.uuid,
        type: event_type,
        created_at: Time.current.iso8601,
        data: data
      }
    end
  end
end

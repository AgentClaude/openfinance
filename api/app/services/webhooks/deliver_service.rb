module Webhooks
  class DeliverService < ApplicationService
    attr_accessor :event_type, :payload, :user

    validates :event_type, :payload, :user, presence: true

    def call
      return validation_failure(self) unless valid?

      subscriptions = user.webhook_subscriptions.for_event(event_type)
      return success(delivered: 0) if subscriptions.empty?

      delivered = 0
      subscriptions.find_each do |sub|
        DeliverWebhookJob.perform_later(sub.id, event_type, payload.as_json)
        delivered += 1
      end

      success(delivered: delivered)
    end
  end
end

module Subscriptions
  class ReactivateService < ApplicationService
    attr_accessor :household

    validates :household, presence: true

    def call
      return validation_failure(self) unless valid?

      subscription = household.subscription
      return failure("No subscription found") unless subscription
      return failure("Subscription is not pending cancellation") unless subscription.cancel_at_period_end?

      begin
        if subscription.stripe_subscription_id.present?
          Stripe::Subscription.update(
            subscription.stripe_subscription_id,
            { cancel_at_period_end: false }
          )
        end

        subscription.reactivate!
        success(subscription: subscription)
      rescue Stripe::StripeError => e
        failure("Failed to reactivate: #{e.message}")
      end
    end
  end
end

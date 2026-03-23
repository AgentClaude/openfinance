module Subscriptions
  class CancelService < ApplicationService
    attr_accessor :household, :at_period_end

    validates :household, presence: true

    def call
      return validation_failure(self) unless valid?

      subscription = household.subscription
      return failure("No active subscription found") unless subscription
      return failure("Subscription is already canceled") if subscription.canceled?

      # Free plans can't be canceled
      return failure("Cannot cancel a free plan") if subscription.plan.free?

      begin
        cancel_stripe_subscription(subscription)
        
        if at_period_end
          subscription.update!(
            cancel_at_period_end: true,
            cancel_at: subscription.current_period_end
          )
        else
          subscription.update!(
            status: 'canceled',
            canceled_at: Time.current,
            cancel_at_period_end: false
          )
        end

        success(subscription: subscription)
      rescue Stripe::StripeError => e
        failure("Failed to cancel subscription: #{e.message}")
      end
    end

    private

    def cancel_stripe_subscription(subscription)
      return unless subscription.stripe_subscription_id.present?

      if at_period_end
        Stripe::Subscription.update(
          subscription.stripe_subscription_id,
          { cancel_at_period_end: true }
        )
      else
        Stripe::Subscription.cancel(subscription.stripe_subscription_id)
      end
    end
  end
end

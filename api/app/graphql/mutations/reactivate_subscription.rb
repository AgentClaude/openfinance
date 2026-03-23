module Mutations
  class ReactivateSubscription < BaseMutation
    type Types::SubscriptionType

    def resolve
      hh = require_auth!
      subscription = hh.subscription

      raise GraphQL::ExecutionError, "No subscription found" unless subscription
      raise GraphQL::ExecutionError, "Subscription is not pending cancellation" unless subscription.cancel_at_period_end?

      begin
        if subscription.stripe_subscription_id.present?
          Stripe::Subscription.update(
            subscription.stripe_subscription_id,
            { cancel_at_period_end: false }
          )
        end

        subscription.reactivate!
        log_activity(action: 'subscription_reactivated', resource: subscription)
        subscription
      rescue Stripe::StripeError => e
        raise GraphQL::ExecutionError, "Failed to reactivate: #{e.message}"
      end
    end
  end
end

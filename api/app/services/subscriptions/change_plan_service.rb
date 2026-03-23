module Subscriptions
  class ChangePlanService < ApplicationService
    attr_accessor :household, :new_plan, :billing_interval

    validates :household, :new_plan, presence: true

    def call
      return validation_failure(self) unless valid?

      subscription = household.subscription
      return failure("No active subscription found") unless subscription
      return failure("Already on this plan") if subscription.plan_id == new_plan.id

      old_plan = subscription.plan

      if new_plan.free?
        return downgrade_to_free(subscription)
      end

      if subscription.stripe_subscription_id.blank?
        # Was on free plan, needs Stripe setup
        return failure("Please set up payment first to upgrade to a paid plan")
      end

      begin
        update_stripe_subscription(subscription)
        subscription.update!(
          plan: new_plan,
          billing_interval: billing_interval || subscription.billing_interval
        )
        success(subscription: subscription, previous_plan: old_plan)
      rescue Stripe::StripeError => e
        failure("Failed to change plan: #{e.message}")
      end
    end

    private

    def downgrade_to_free(subscription)
      # Cancel Stripe subscription if exists
      if subscription.stripe_subscription_id.present?
        begin
          Stripe::Subscription.cancel(subscription.stripe_subscription_id)
        rescue Stripe::StripeError => e
          Rails.logger.warn("Failed to cancel Stripe subscription: #{e.message}")
        end
      end

      subscription.update!(
        plan: new_plan,
        status: 'active',
        cancel_at_period_end: false,
        cancel_at: nil,
        stripe_subscription_id: nil
      )
      success(subscription: subscription)
    end

    def update_stripe_subscription(subscription)
      stripe_sub = Stripe::Subscription.retrieve(subscription.stripe_subscription_id)
      price_id = billing_interval == 'annual' ? new_plan.stripe_price_id_annual : new_plan.stripe_price_id

      Stripe::Subscription.update(
        subscription.stripe_subscription_id,
        {
          items: [{
            id: stripe_sub.items.data[0].id,
            price: price_id
          }],
          proration_behavior: 'create_prorations'
        }
      )
    end
  end
end

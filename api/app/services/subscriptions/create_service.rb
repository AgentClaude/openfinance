module Subscriptions
  class CreateService < ApplicationService
    attr_accessor :household, :plan, :billing_interval, :stripe_payment_method_id

    validates :household, :plan, presence: true

    def call
      return validation_failure(self) unless valid?

      # Don't allow creating if one already exists
      if household.subscription.present?
        return failure("Household already has a subscription. Use update instead.")
      end

      subscription = build_subscription
      
      if plan.free?
        # Free plan — no Stripe needed
        subscription.status = 'active'
        subscription.save!
        return success(subscription: subscription)
      end

      # Paid plan — create Stripe customer + subscription
      begin
        stripe_result = create_stripe_subscription(subscription)
        subscription.assign_attributes(stripe_result)
        subscription.save!
        success(subscription: subscription)
      rescue Stripe::StripeError => e
        failure("Payment processing failed: #{e.message}")
      rescue ActiveRecord::RecordInvalid => e
        failure("Failed to create subscription: #{e.message}")
      end
    end

    private

    def build_subscription
      household.build_subscription(
        plan: plan,
        billing_interval: billing_interval || 'monthly',
        status: 'incomplete'
      )
    end

    def create_stripe_subscription(subscription)
      # Create or retrieve Stripe customer
      customer = find_or_create_stripe_customer

      # Attach payment method if provided
      if stripe_payment_method_id.present?
        Stripe::PaymentMethod.attach(
          stripe_payment_method_id,
          { customer: customer.id }
        )
        Stripe::Customer.update(
          customer.id,
          { invoice_settings: { default_payment_method: stripe_payment_method_id } }
        )
      end

      # Create Stripe subscription
      price_id = billing_interval == 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id
      stripe_sub = Stripe::Subscription.create(
        customer: customer.id,
        items: [{ price: price_id }],
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      )

      {
        stripe_customer_id: customer.id,
        stripe_subscription_id: stripe_sub.id,
        status: map_stripe_status(stripe_sub.status),
        trial_ends_at: stripe_sub.trial_end ? Time.at(stripe_sub.trial_end) : nil,
        current_period_start: Time.at(stripe_sub.current_period_start),
        current_period_end: Time.at(stripe_sub.current_period_end)
      }
    end

    def find_or_create_stripe_customer
      owner = household.owners.first

      Stripe::Customer.create(
        email: owner.email,
        name: owner.name,
        metadata: { household_id: household.id }
      )
    end

    def map_stripe_status(stripe_status)
      case stripe_status
      when 'trialing' then 'trialing'
      when 'active' then 'active'
      when 'past_due' then 'past_due'
      when 'canceled' then 'canceled'
      when 'unpaid' then 'unpaid'
      when 'incomplete' then 'incomplete'
      else 'incomplete'
      end
    end
  end
end

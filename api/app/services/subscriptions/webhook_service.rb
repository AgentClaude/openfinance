module Subscriptions
  class WebhookService < ApplicationService
    attr_accessor :event

    def call
      return failure("No event provided") unless event

      case event.type
      when 'customer.subscription.updated'
        handle_subscription_updated(event.data.object)
      when 'customer.subscription.deleted'
        handle_subscription_deleted(event.data.object)
      when 'invoice.payment_succeeded'
        handle_payment_succeeded(event.data.object)
      when 'invoice.payment_failed'
        handle_payment_failed(event.data.object)
      when 'customer.subscription.trial_will_end'
        handle_trial_ending(event.data.object)
      else
        success(message: "Unhandled event type: #{event.type}")
      end
    end

    private

    def handle_subscription_updated(stripe_sub)
      subscription = find_subscription(stripe_sub.id)
      return failure("Subscription not found") unless subscription

      subscription.update!(
        status: stripe_sub.status,
        current_period_start: Time.at(stripe_sub.current_period_start),
        current_period_end: Time.at(stripe_sub.current_period_end),
        cancel_at_period_end: stripe_sub.cancel_at_period_end,
        cancel_at: stripe_sub.cancel_at ? Time.at(stripe_sub.cancel_at) : nil,
        canceled_at: stripe_sub.canceled_at ? Time.at(stripe_sub.canceled_at) : nil,
        trial_ends_at: stripe_sub.trial_end ? Time.at(stripe_sub.trial_end) : nil
      )

      success(subscription: subscription)
    end

    def handle_subscription_deleted(stripe_sub)
      subscription = find_subscription(stripe_sub.id)
      return failure("Subscription not found") unless subscription

      free_plan = Plan.find_by(slug: 'free')
      subscription.update!(
        status: 'canceled',
        canceled_at: Time.current,
        plan: free_plan || subscription.plan
      )

      notify_owner(subscription,
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. You have been moved to the Free plan.')

      success(subscription: subscription)
    end

    def handle_payment_succeeded(invoice)
      return success(message: "Not a subscription invoice") unless invoice.subscription

      subscription = find_subscription(invoice.subscription)
      return failure("Subscription not found") unless subscription

      subscription.update!(status: 'active') if subscription.status != 'active'
      success(subscription: subscription)
    end

    def handle_payment_failed(invoice)
      return success(message: "Not a subscription invoice") unless invoice.subscription

      subscription = find_subscription(invoice.subscription)
      return failure("Subscription not found") unless subscription

      subscription.update!(status: 'past_due')

      notify_owner(subscription,
        title: 'Payment Failed',
        message: 'Your payment failed. Please update your payment method to avoid service interruption.')

      success(subscription: subscription)
    end

    def handle_trial_ending(stripe_sub)
      subscription = find_subscription(stripe_sub.id)
      return failure("Subscription not found") unless subscription

      notify_owner(subscription,
        title: 'Trial Ending Soon',
        message: "Your free trial ends in #{subscription.trial_days_remaining} days. Add a payment method to continue your subscription.")

      success(subscription: subscription)
    end

    def find_subscription(stripe_subscription_id)
      Subscription.find_by(stripe_subscription_id: stripe_subscription_id)
    end

    def notify_owner(subscription, title:, message:)
      owner = subscription.household.owners.first
      return unless owner

      Notification.create(
        user: owner,
        household: subscription.household,
        notification_type: 'security_alert',
        title: title,
        message: message,
        is_read: false
      )
    end
  end
end

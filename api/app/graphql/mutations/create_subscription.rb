module Mutations
  class CreateSubscription < BaseMutation
    argument :plan_id, ID, required: true
    argument :billing_interval, String, required: false, default_value: 'monthly'
    argument :stripe_payment_method_id, String, required: false

    type Types::SubscriptionType

    def resolve(plan_id:, billing_interval:, stripe_payment_method_id: nil)
      hh = require_auth!
      plan = Plan.find(plan_id)

      result = Subscriptions::CreateService.call(
        household: hh,
        plan: plan,
        billing_interval: billing_interval,
        stripe_payment_method_id: stripe_payment_method_id
      )

      if result.success?
        log_activity(action: 'subscription_created', resource: result.data[:subscription],
                     metadata: { plan_name: plan.name })
        result.data[:subscription]
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

module Mutations
  class ChangePlan < BaseMutation
    argument :plan_id, ID, required: true
    argument :billing_interval, String, required: false

    type Types::SubscriptionType

    def resolve(plan_id:, billing_interval: nil)
      hh = require_auth!
      new_plan = Plan.find(plan_id)

      result = Subscriptions::ChangePlanService.call(
        household: hh,
        new_plan: new_plan,
        billing_interval: billing_interval
      )

      if result.success?
        log_activity(action: 'plan_changed', resource: result.data[:subscription],
                     metadata: { plan_name: new_plan.name })
        result.data[:subscription]
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

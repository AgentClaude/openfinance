module Mutations
  class CancelSubscription < BaseMutation
    argument :at_period_end, Boolean, required: false, default_value: true

    type Types::SubscriptionType

    def resolve(at_period_end:)
      hh = require_auth!

      result = Subscriptions::CancelService.call(
        household: hh,
        at_period_end: at_period_end
      )

      if result.success?
        log_activity(action: 'subscription_canceled', resource: result.data[:subscription],
                     metadata: { at_period_end: at_period_end })
        result.data[:subscription]
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

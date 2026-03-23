module Mutations
  class ReactivateSubscription < BaseMutation
    type Types::SubscriptionType

    def resolve
      hh = require_auth!

      result = Subscriptions::ReactivateService.call(household: hh)

      if result.success?
        log_activity(action: 'subscription_reactivated', resource: result.data[:subscription])
        result.data[:subscription]
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

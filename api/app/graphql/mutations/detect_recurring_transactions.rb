module Mutations
  class DetectRecurringTransactions < BaseMutation
    field :detected_count, Integer, null: false
    field :recurring_items, [Types::RecurringItemType], null: false

    def resolve
      hh = require_auth!

      service = Recurring::DetectRecurringService.new(hh: hh)
      result = service.call

      if result.success?
        { detected_count: result.data[:detected_count], recurring_items: result.data[:items] }
      else
        raise GraphQL::ExecutionError, result.error
      end
    end
  end
end

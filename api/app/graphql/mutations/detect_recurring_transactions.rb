module Mutations
  class DetectRecurringTransactions < BaseMutation
    field :detected_count, Integer, null: false
    field :recurring_items, [Types::RecurringItemType], null: false

    def resolve
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      service = Recurring::DetectRecurringService.new(household: household)
      result = service.call

      if result.success?
        { detected_count: result.data[:detected_count], recurring_items: result.data[:items] }
      else
        raise GraphQL::ExecutionError, result.error
      end
    end
  end
end

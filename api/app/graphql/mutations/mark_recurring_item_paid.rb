module Mutations
  class MarkRecurringItemPaid < BaseMutation
    argument :id, ID, required: true
    argument :transaction_id, ID, required: false

    type Types::RecurringItemType

    def resolve(id:, transaction_id: nil)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      item = household.recurring_items.find_by(id: id)
      raise GraphQL::ExecutionError, "Recurring item not found" unless item

      today = Date.current
      item.last_occurrence = today
      item.occurrence_count = (item.occurrence_count || 0) + 1
      item.next_occurrence = case item.frequency
                             when 'weekly' then today + 7.days
                             when 'biweekly' then today + 14.days
                             when 'monthly' then today + 1.month
                             when 'quarterly' then today + 3.months
                             when 'yearly' then today + 1.year
                             else today + 1.month
                             end
      item.save!
      item
    end
  end
end

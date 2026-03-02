module Mutations
  class MarkRecurringItemPaid < BaseMutation
    argument :id, ID, required: true
    argument :transaction_id, ID, required: false

    type Types::RecurringItemType

    def resolve(id:, transaction_id: nil)
      hh = require_auth!

      item = hh.recurring_items.find_by(id: id)
      raise GraphQL::ExecutionError, "Recurring item not found" unless item
      authorize(item, :update?)

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

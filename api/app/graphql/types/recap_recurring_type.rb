module Types
  class RecapRecurringType < Types::BaseObject
    field :total_recurring_expenses, Float, null: false
    field :total_recurring_income, Float, null: false
    field :bills_due_count, Integer, null: false
    field :bills_paid_count, Integer, null: false
    field :upcoming, [Types::RecapRecurringItemType], null: false
  end
end

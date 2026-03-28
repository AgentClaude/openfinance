module Types
  class RecapRecurringItemType < Types::BaseObject
    field :name, String, null: false
    field :amount, Float, null: false
    field :due_date, String, null: true
    field :is_paid, Boolean, null: false
  end
end

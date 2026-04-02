module Types
  class ComparisonTotalsType < Types::BaseObject
    field :period_a_income, Float, null: false
    field :period_b_income, Float, null: false
    field :income_change, Float, null: false
    field :income_change_percent, Float, null: false
    field :period_a_expenses, Float, null: false
    field :period_b_expenses, Float, null: false
    field :expenses_change, Float, null: false
    field :expenses_change_percent, Float, null: false
    field :period_a_net, Float, null: false
    field :period_b_net, Float, null: false
    field :net_change, Float, null: false
    field :period_a_transaction_count, Integer, null: false
    field :period_b_transaction_count, Integer, null: false
  end
end

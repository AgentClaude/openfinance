module Types
  class BudgetPerformanceType < Types::BaseObject
    field :months_on_budget, Integer, null: false
    field :months_over_budget, Integer, null: false
    field :total_months, Integer, null: false
  end
end

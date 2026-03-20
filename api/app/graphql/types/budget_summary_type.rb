module Types
  class BudgetSummaryType < Types::BaseObject
    field :month, String, null: false
    field :total_budgeted, Float, null: false
    field :total_spent, Float, null: false
    field :total_income, Float, null: false
    field :income_actual, Float, null: false
    field :left_to_budget, Float, null: false
    field :category_groups, [Types::BudgetCategoryGroupType], null: false
    field :budget_mode, String, null: false
    field :spending_target, Float, null: false
  end
end

module Types
  class RecapBudgetType < Types::BaseObject
    field :has_budget, Boolean, null: false
    field :total_budgeted, Float, null: false
    field :total_spent, Float, null: false
    field :remaining, Float, null: false
    field :percent_used, Float, null: true
    field :on_track, Boolean, null: false
    field :categories_over_budget, Integer, null: true
    field :categories, [Types::RecapBudgetCategoryType], null: false
  end
end

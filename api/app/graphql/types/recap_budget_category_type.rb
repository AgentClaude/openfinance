module Types
  class RecapBudgetCategoryType < Types::BaseObject
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :budgeted, Float, null: false
    field :spent, Float, null: false
    field :remaining, Float, null: false
    field :percent_used, Float, null: false
    field :over_budget, Boolean, null: false
  end
end

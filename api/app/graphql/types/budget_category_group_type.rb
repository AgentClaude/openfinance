module Types
  class BudgetCategoryGroupType < Types::BaseObject
    field :name, String, null: false
    field :budgeted, Float, null: false
    field :spent, Float, null: false
    field :items, [Types::BudgetItemType], null: false
  end
end

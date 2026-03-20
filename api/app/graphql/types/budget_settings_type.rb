module Types
  class BudgetSettingsType < Types::BaseObject
    field :budget_mode, String, null: false
    field :spending_target, Float, null: false
  end
end

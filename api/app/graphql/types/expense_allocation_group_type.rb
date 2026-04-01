module Types
  class ExpenseAllocationGroupType < Types::BaseObject
    field :group, String, null: false
    field :total, Float, null: false
    field :monthly_average, Float, null: false
    field :percent, Float, null: false
    field :category_type, String, null: false
  end
end

module Types
  class AllocationBreakdownType < Types::BaseObject
    field :needs, Types::AllocationCategoryType, null: false
    field :wants, Types::AllocationCategoryType, null: false
    field :savings, Types::AllocationCategoryType, null: false
    field :other_expenses, Types::AllocationOtherType, null: false
    field :avg_monthly_income, Float, null: false
  end
end

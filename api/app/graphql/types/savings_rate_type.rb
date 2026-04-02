module Types
  class SavingsRateType < Types::BaseObject
    field :summary, Types::SavingsRateSummaryType, null: false
    field :monthly_trends, [Types::SavingsRateMonthType], null: false
    field :allocation, Types::AllocationBreakdownType, null: false
    field :income_sources, [Types::IncomeSourceType], null: false
    field :expense_allocation, [Types::ExpenseAllocationGroupType], null: false
    field :streaks, Types::SavingsStreakType, null: false
    field :recommendations, [Types::SavingsRecommendationType], null: false
  end
end

module Types
  class MonthlySpendingByCategoryType < Types::BaseObject
    field :month, String, null: false
    field :categories, [Types::CategorySpendingReportType], null: false
  end
end

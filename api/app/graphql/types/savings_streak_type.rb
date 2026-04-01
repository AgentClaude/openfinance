module Types
  class SavingsStreakType < Types::BaseObject
    field :positive_savings_months, Integer, null: false
    field :above_20_percent_months, Integer, null: false
    field :total_months, Integer, null: false
  end
end

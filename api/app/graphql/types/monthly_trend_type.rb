module Types
  class MonthlyTrendType < Types::BaseObject
    field :month, String, null: false
    field :label, String, null: false
    field :income, Float, null: false
    field :expenses, Float, null: false
    field :savings, Float, null: false
  end
end

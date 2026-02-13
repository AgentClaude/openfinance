module Types
  class MonthlySummaryType < Types::BaseObject
    field :month, String, null: false
    field :income, Float, null: false
    field :expenses, Float, null: false
    field :cash_flow, Float, null: false
  end
end

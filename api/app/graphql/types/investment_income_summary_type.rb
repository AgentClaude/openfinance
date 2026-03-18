module Types
  class InvestmentIncomeSummaryType < Types::BaseObject
    field :total_income, Float, null: false
    field :dividends, Float, null: false
    field :interest, Float, null: false
    field :capital_gains, Float, null: false
  end
end

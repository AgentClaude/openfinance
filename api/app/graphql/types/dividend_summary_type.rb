module Types
  class DividendSummaryType < Types::BaseObject
    field :total_dividends, Float, null: false
    field :by_security, [Types::DividendBySecurityType], null: false
    field :by_month, [Types::DividendByMonthType], null: false
    field :transaction_count, Integer, null: false
  end
end

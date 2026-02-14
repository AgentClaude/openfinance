module Types
  class PortfolioSummaryType < Types::BaseObject
    field :total_value, Float, null: false
    field :total_cost_basis, Float, null: false
    field :total_gain_loss, Float, null: false
    field :total_gain_loss_percentage, Float, null: false
    field :total_holdings_count, Integer, null: false
    field :allocations, [Types::PortfolioAllocationType], null: false
  end
end

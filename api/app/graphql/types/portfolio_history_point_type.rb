module Types
  class PortfolioHistoryPointType < Types::BaseObject
    field :date, String, null: false
    field :total_value, Float, null: false
    field :total_cost_basis, Float, null: false
    field :gain_loss, Float, null: false
  end
end

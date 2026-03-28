module Types
  class RecapIncomeType < Types::BaseObject
    field :total, Float, null: false
    field :previous_month, Float, null: false
    field :change, Float, null: false
    field :change_percentage, Float, null: false
    field :top_sources, [Types::RecapIncomeSourceType], null: false
  end
end

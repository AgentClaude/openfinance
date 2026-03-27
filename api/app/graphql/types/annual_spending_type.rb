module Types
  class AnnualSpendingType < Types::BaseObject
    field :total, Float, null: false
    field :monthly_average, Float, null: false
    field :daily_average, Float, null: false
  end
end

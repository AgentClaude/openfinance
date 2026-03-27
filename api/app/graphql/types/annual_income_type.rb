module Types
  class AnnualIncomeType < Types::BaseObject
    field :total, Float, null: false
    field :monthly_average, Float, null: false
  end
end

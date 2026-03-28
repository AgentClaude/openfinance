module Types
  class RecapSavingsType < Types::BaseObject
    field :amount, Float, null: false
    field :rate, Float, null: false
    field :previous_amount, Float, null: false
    field :previous_rate, Float, null: false
  end
end

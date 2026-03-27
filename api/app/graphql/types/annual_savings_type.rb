module Types
  class AnnualSavingsType < Types::BaseObject
    field :total, Float, null: false
    field :rate, Float, null: false
  end
end

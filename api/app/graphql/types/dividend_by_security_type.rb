module Types
  class DividendBySecurityType < Types::BaseObject
    field :symbol, String, null: false
    field :name, String, null: false
    field :amount, Float, null: false
  end
end

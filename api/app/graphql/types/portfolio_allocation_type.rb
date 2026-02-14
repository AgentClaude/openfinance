module Types
  class PortfolioAllocationType < Types::BaseObject
    field :security_name, String, null: false
    field :symbol, String, null: false
    field :security_type, String, null: true
    field :value, Float, null: false
    field :percentage, Float, null: false
  end
end

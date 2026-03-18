module Types
  class DividendByMonthType < Types::BaseObject
    field :month, String, null: false
    field :amount, Float, null: false
  end
end

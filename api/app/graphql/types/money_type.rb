# GraphQL type for Money objects
# Represents monetary amounts with currency information

module Types
  class MoneyType < Types::BaseObject
    description "A monetary amount with currency"

    field :amount, Float, null: false, description: "The amount as a decimal number"
    field :cents, Integer, null: false, description: "The amount in the smallest currency unit"
    field :currency, String, null: false, description: "ISO currency code (e.g., USD)"
    field :formatted, String, null: false, description: "Formatted amount with currency symbol"

    def amount
      object.to_f
    end

    def cents
      object.cents
    end

    def currency
      object.currency.iso_code
    end

    def formatted
      object.format(symbol: true, no_cents_if_whole: true)
    end
  end
end
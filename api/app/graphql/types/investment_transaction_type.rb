module Types
  class InvestmentTransactionType < Types::BaseObject
    field :id, ID, null: false
    field :account_id, ID, null: false
    field :security, Types::SecurityType, null: false
    field :transaction_type, String, null: false
    field :amount, Float, null: false
    field :quantity, Float, null: true
    field :price, Float, null: true
    field :date, String, null: false
    field :description, String, null: true
    field :currency, String, null: false

    def amount
      object.amount_cents / 100.0
    end

    def price
      object.price_cents ? object.price_cents / 100.0 : nil
    end

    def date
      object.date.iso8601
    end
  end
end

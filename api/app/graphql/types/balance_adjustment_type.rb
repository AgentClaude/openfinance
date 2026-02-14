module Types
  class BalanceAdjustmentType < Types::BaseObject
    field :id, ID, null: false
    field :account_id, ID, null: false
    field :amount, Float, null: false
    field :currency, String, null: false
    field :adjusted_at, String, null: false
    field :notes, String, null: true
    field :created_by_name, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def amount
      object.amount_cents / 100.0
    end

    def adjusted_at
      object.adjusted_at.iso8601
    end

    def created_by_name
      object.created_by&.name
    end
  end
end

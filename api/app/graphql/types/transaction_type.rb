module Types
  class TransactionType < Types::BaseObject
    field :id, ID, null: false
    field :amount, Float, null: false
    field :description, String, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :pending, Boolean, null: false
    field :needs_review, Boolean, null: false
    field :account_id, ID, null: false
    field :category_id, ID, null: true
    field :subcategory_id, ID, null: true
    field :merchant_name, String, null: true
    field :plaid_transaction_id, String, null: true
    field :account, Types::AccountType, null: false
    field :category, Types::CategoryType, null: true
    field :subcategory, Types::CategoryType, null: true
    field :tags, [Types::TagType], null: false
    field :is_split, Boolean, null: false
    field :is_transfer, Boolean, null: false
    field :excluded, Boolean, null: false
    field :parent_transaction_id, ID, null: true
    field :transfer_pair_id, ID, null: true

    def amount
      object.amount_cents / 100.0
    end

    def description
      object.name
    end

    def pending
      object.is_pending
    end

    def subcategory_id
      nil
    end

    def subcategory
      nil
    end

    def tags
      object.tags
    end
  end
end

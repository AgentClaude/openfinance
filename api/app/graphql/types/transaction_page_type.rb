module Types
  class TransactionPageType < Types::BaseObject
    field :transactions, [Types::TransactionType], null: false
    field :total_count, Integer, null: false
    field :has_more, Boolean, null: false
  end
end

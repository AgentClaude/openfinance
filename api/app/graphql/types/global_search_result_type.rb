module Types
  class GlobalSearchResultType < Types::BaseObject
    field :transactions, [Types::TransactionType], null: false
    field :accounts, [Types::AccountType], null: false
    field :categories, [Types::CategoryType], null: false
    field :merchants, [Types::MerchantSearchResultType], null: false
    field :tags, [Types::TagType], null: false
  end
end

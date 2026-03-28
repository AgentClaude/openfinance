module Types
  class RecapTransactionSummaryType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :amount, Float, null: false
    field :date, String, null: false
    field :category_name, String, null: true
    field :account_name, String, null: true
  end
end

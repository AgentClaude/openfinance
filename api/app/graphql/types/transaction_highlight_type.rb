module Types
  class TransactionHighlightType < Types::BaseObject
    field :amount, Float, null: false
    field :description, String, null: false
    field :date, String, null: false
  end
end

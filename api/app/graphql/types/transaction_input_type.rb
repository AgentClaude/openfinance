module Types
  class TransactionInputType < GraphQL::Schema::InputObject
    argument :amount, Float, required: false
    argument :description, String, required: false
    argument :date, String, required: false
    argument :account_id, ID, required: false
    argument :category_id, ID, required: false
    argument :merchant_name, String, required: false
    argument :pending, Boolean, required: false, default_value: false
    argument :needs_review, Boolean, required: false, default_value: false
    argument :notes, String, required: false
  end
end

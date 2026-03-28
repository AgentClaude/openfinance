module Types
  class DebtAccountType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :account_type, String, null: false
    field :balance_cents, Integer, null: false
    field :interest_rate, Float, null: false
    field :minimum_payment_cents, Integer, null: false
  end
end

module Types
  class AccountBalanceType < Types::BaseObject
    field :account_id, ID, null: false
    field :account_name, String, null: false
    field :account_type, String, null: false
    field :balance, Float, null: false
  end
end

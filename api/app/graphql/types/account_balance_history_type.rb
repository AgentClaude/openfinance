module Types
  class AccountBalanceHistoryType < Types::BaseObject
    field :id, ID, null: false
    field :account_id, ID, null: false
    field :date, String, null: false
    field :balance, Float, null: false

    def date
      object.date.strftime('%Y-%m-%d')
    end

    def balance
      object.balance_cents / 100.0
    end
  end
end

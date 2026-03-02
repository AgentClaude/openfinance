module Types
  class AccountBalanceHistoryType < Types::BaseObject
    field :id, ID, null: false
    field :date, String, null: false
    field :balance, Float, null: false
    field :currency, String, null: false

    def date
      object.date.iso8601
    end

    def balance
      object.current_balance_cents / 100.0
    end
  end
end

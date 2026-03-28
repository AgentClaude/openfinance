module Types
  class DebtTimelinePointType < Types::BaseObject
    field :month, Integer, null: false
    field :total_remaining_cents, Integer, null: false
    field :interest_paid_cents, Integer, null: false
    field :principal_paid_cents, Integer, null: false
    field :balances, [Integer], null: false
  end
end

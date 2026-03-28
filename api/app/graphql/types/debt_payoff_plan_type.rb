module Types
  class DebtPayoffPlanType < Types::BaseObject
    field :debts, [Types::DebtAccountType], null: false
    field :total_debt_cents, Integer, null: false
    field :total_minimum_cents, Integer, null: false
    field :extra_payment_cents, Integer, null: false
    field :snowball, Types::DebtPayoffStrategyType, null: false
    field :avalanche, Types::DebtPayoffStrategyType, null: false
    field :minimum_only, Types::DebtPayoffStrategyType, null: false
    field :interest_saved_snowball_cents, Integer, null: false
    field :interest_saved_avalanche_cents, Integer, null: false
    field :months_saved_snowball, Integer, null: false
    field :months_saved_avalanche, Integer, null: false
  end
end

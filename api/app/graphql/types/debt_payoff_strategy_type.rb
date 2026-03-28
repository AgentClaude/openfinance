module Types
  class DebtPayoffStrategyType < Types::BaseObject
    field :strategy, String, null: false
    field :months_to_payoff, Integer, null: false
    field :total_interest_cents, Integer, null: false
    field :total_cost_cents, Integer, null: false
    field :payoff_date, GraphQL::Types::ISO8601Date, null: false
    field :timeline, [Types::DebtTimelinePointType], null: false
  end
end

module Types
  class FireCalculatorType < Types::BaseObject
    field :summary, Types::FireSummaryType, null: false
    field :financials, Types::FireFinancialsType, null: false
    field :projections, [Types::FireProjectionType], null: false
    field :scenarios, [Types::FireScenarioType], null: false
    field :milestones, [Types::FireMilestoneType], null: false
    field :tips, [Types::FireTipType], null: false
  end
end

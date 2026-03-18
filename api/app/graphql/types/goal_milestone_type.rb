module Types
  class GoalMilestoneType < Types::BaseObject
    field :id, ID, null: false
    field :percentage, Integer, null: false
    field :amount_at_milestone, Float, null: false
    field :achieved_at, GraphQL::Types::ISO8601DateTime, null: false
    field :label, String, null: false
    field :emoji, String, null: false

    def amount_at_milestone
      object.amount_at_milestone_cents / 100.0
    end
  end
end

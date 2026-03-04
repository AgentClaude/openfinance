module Mutations
  class CreateGoal < BaseMutation
    argument :name, String, required: true
    argument :description, String, required: false
    argument :goal_type, String, required: false, default_value: 'savings'
    argument :target_amount, Float, required: true
    argument :current_amount, Float, required: false, default_value: 0
    argument :target_date, String, required: false
    argument :icon, String, required: false
    argument :color, String, required: false

    type Types::GoalType

    def resolve(**args)
      hh = require_auth!
      goal = hh.goals.new(
        name: args[:name],
        description: args[:description],
        goal_type: args[:goal_type],
        target_amount_cents: (args[:target_amount] * 100).to_i,
        current_amount_cents: (args[:current_amount] * 100).to_i,
        target_date: args[:target_date].present? ? Date.parse(args[:target_date]) : nil
      )

      goal.save!
      log_activity(action: 'goal_created', resource: goal, metadata: { goal_name: goal.name })
      goal
    end
  end
end

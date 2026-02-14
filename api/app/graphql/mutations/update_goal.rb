module Mutations
  class UpdateGoal < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :goal_type, String, required: false
    argument :target_amount, Float, required: false
    argument :current_amount, Float, required: false
    argument :target_date, String, required: false
    argument :is_active, Boolean, required: false

    type Types::GoalType

    def resolve(**args)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      goal = household.goals.find(args[:id])

      attrs = {}
      attrs[:name] = args[:name] if args.key?(:name)
      attrs[:description] = args[:description] if args.key?(:description)
      attrs[:goal_type] = args[:goal_type] if args.key?(:goal_type)
      attrs[:target_amount_cents] = (args[:target_amount] * 100).to_i if args.key?(:target_amount)
      attrs[:current_amount_cents] = (args[:current_amount] * 100).to_i if args.key?(:current_amount)
      attrs[:target_date] = args[:target_date].present? ? Date.parse(args[:target_date]) : nil if args.key?(:target_date)
      attrs[:is_active] = args[:is_active] if args.key?(:is_active)

      goal.update!(attrs)
      goal
    end
  end
end

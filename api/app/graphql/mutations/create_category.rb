module Mutations
  class CreateCategory < BaseMutation
    argument :input, Types::CategoryInputType, required: true

    type Types::CategoryType

    def resolve(input:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      household.categories.create!(
        name: input.name,
        icon: input.icon,
        color: input.color,
        color_hex: input.color,
        group_name: input.group_name,
        parent_id: input.parent_id,
        is_system: false
      )
    end
  end
end

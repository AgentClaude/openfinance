module Mutations
  class CreateCategory < BaseMutation
    argument :input, Types::CategoryInputType, required: true

    type Types::CategoryType

    def resolve(input:)
      hh = require_auth!

      hh.categories.create!(
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

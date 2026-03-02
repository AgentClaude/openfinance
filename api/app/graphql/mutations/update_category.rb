module Mutations
  class UpdateCategory < BaseMutation
    argument :id, ID, required: true
    argument :input, Types::CategoryInputType, required: true

    type Types::CategoryType

    def resolve(id:, input:)
      hh = require_auth!
      cat = authorize(hh.categories.find(id), :update?)
      cat.update!(
        name: input.name,
        icon: input.icon,
        color: input.color,
        color_hex: input.color,
        group_name: input.group_name,
        parent_id: input.parent_id
      )
      cat
    end
  end
end

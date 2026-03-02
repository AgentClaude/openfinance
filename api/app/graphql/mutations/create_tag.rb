module Mutations
  class CreateTag < BaseMutation
    argument :input, Types::TagInputType, required: true

    type Types::TagType

    def resolve(input:)
      hh = require_auth!

      hh.tags.create!(
        name: input.name,
        color_hex: input.color || Tag.new.send(:generate_color_from_name)
      )
    end
  end
end

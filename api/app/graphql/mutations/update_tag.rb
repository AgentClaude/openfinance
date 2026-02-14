module Mutations
  class UpdateTag < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :color_hex, String, required: false
    argument :is_active, Boolean, required: false

    type Types::TagType

    def resolve(id:, name: nil, color_hex: nil, is_active: nil)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      tag = user.household.tags.find(id)
      attrs = {}
      attrs[:name] = name if name.present?
      attrs[:color_hex] = color_hex if color_hex.present?
      attrs[:is_active] = is_active unless is_active.nil?

      tag.update!(attrs) if attrs.any?
      tag
    end
  end
end

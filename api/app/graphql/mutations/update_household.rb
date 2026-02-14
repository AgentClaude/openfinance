module Mutations
  class UpdateHousehold < BaseMutation
    argument :name, String, required: false
    argument :currency, String, required: false

    field :household, Types::HouseholdType, null: true
    field :errors, [String], null: false

    def resolve(name: nil, currency: nil)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      household = user.household
      raise GraphQL::ExecutionError, "No household found" unless household

      attrs = {}
      attrs[:name] = name if name.present?
      attrs[:currency] = currency if currency.present?

      if attrs.any? && household.update(attrs)
        { household: household, errors: [] }
      elsif attrs.empty?
        { household: household, errors: [] }
      else
        { household: nil, errors: household.errors.full_messages }
      end
    end
  end
end

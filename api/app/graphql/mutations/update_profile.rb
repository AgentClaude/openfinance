module Mutations
  class UpdateProfile < BaseMutation
    argument :name, String, required: false
    argument :email, String, required: false
    argument :currency, String, required: false

    type Types::UserType

    def resolve(name: nil, email: nil, currency: nil)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      attrs = {}
      attrs[:name] = name if name.present?
      attrs[:email] = email if email.present?
      user.update!(attrs) if attrs.any?

      if currency.present? && user.household
        user.household.update!(currency: currency)
      end

      user.reload
    end
  end
end

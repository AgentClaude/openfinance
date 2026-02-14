module Mutations
  class DeleteAccount < BaseMutation
    argument :password, String, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(password:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      unless user.valid_password?(password)
        return { success: false, errors: ["Invalid password"] }
      end

      # Soft delete: anonymize user data
      user.update!(
        name: "Deleted User",
        email: "deleted_#{user.id}_#{SecureRandom.hex(4)}@deleted.openfinance.local",
        deleted_at: Time.current
      )

      # Revoke JWT
      user.update!(jti: SecureRandom.uuid)

      { success: true, errors: [] }
    end
  end
end

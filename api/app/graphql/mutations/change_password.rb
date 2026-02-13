module Mutations
  class ChangePassword < BaseMutation
    argument :current_password, String, required: true
    argument :new_password, String, required: true

    field :success, Boolean, null: false
    field :message, String, null: true

    def resolve(current_password:, new_password:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      unless user.valid_password?(current_password)
        return { success: false, message: "Current password is incorrect" }
      end

      if new_password.length < 8
        return { success: false, message: "Password must be at least 8 characters" }
      end

      user.update!(password: new_password)
      { success: true, message: "Password changed successfully" }
    end
  end
end

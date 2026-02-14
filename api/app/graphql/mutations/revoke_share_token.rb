module Mutations
  class RevokeShareToken < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless user

      token = user.share_tokens.find(id)
      token.destroy!
      { success: true, errors: [] }
    rescue ActiveRecord::RecordNotFound
      { success: false, errors: ['Share token not found'] }
    end
  end
end

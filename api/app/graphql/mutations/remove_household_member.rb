module Mutations
  class RemoveHouseholdMember < BaseMutation
    argument :user_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(user_id:)
      current_user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless current_user

      unless current_user.role == 'owner'
        return { success: false, errors: ['Only owners can remove members'] }
      end

      household = current_user.household
      target_user = User.find_by(id: user_id)
      return { success: false, errors: ['User not found'] } unless target_user

      unless household.member?(target_user)
        return { success: false, errors: ['User is not a member of this household'] }
      end

      if target_user.id == current_user.id
        return { success: false, errors: ['Cannot remove yourself'] }
      end

      if household.remove_member(target_user)
        { success: true, errors: [] }
      else
        { success: false, errors: ['Cannot remove the last owner'] }
      end
    end
  end
end

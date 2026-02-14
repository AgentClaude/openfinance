module Mutations
  class UpdateMemberRole < BaseMutation
    argument :user_id, ID, required: true
    argument :role, String, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(user_id:, role:)
      current_user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless current_user

      unless current_user.role == 'owner'
        return { success: false, errors: ['Only owners can update roles'] }
      end

      unless %w[owner member advisor].include?(role)
        return { success: false, errors: ['Invalid role'] }
      end

      household = current_user.household
      target_user = User.find_by(id: user_id)
      return { success: false, errors: ['User not found'] } unless target_user

      unless household.member?(target_user)
        return { success: false, errors: ['User is not a member of this household'] }
      end

      if target_user.id == current_user.id && role != 'owner'
        # Don't allow demoting yourself if you're the only owner
        owner_count = household.users.where(role: 'owner').count +
                      household.household_memberships.where(role: 'owner').count
        if owner_count <= 1
          return { success: false, errors: ['Cannot demote the last owner'] }
        end
      end

      if target_user.household_id == household.id
        target_user.update!(role: role)
      else
        membership = household.household_memberships.find_by(user: target_user)
        membership&.update!(role: role)
      end

      { success: true, errors: [] }
    rescue => e
      { success: false, errors: [e.message] }
    end
  end
end

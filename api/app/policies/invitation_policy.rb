# frozen_string_literal: true

class InvitationPolicy < ApplicationPolicy
  def cancel?
    user.present? && user.role == 'owner' && record.household_id == user.household_id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(household: household)
    end
  end
end

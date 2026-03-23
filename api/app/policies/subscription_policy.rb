# frozen_string_literal: true

class SubscriptionPolicy < ApplicationPolicy
  def show?
    household_member?
  end

  def create?
    household_owner?
  end

  def update?
    household_owner?
  end

  def destroy?
    household_owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless household

      scope.where(household_id: household.id)
    end
  end

  private

  def household_member?
    return false unless user&.household
    record.household_id == user.household_id
  end

  def household_owner?
    household_member? && user.role == 'owner'
  end
end

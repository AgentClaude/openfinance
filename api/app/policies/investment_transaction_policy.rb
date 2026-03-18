# frozen_string_literal: true

class InvestmentTransactionPolicy < ApplicationPolicy
  def create?
    household_member?
  end

  def destroy?
    household_member?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless household

      account_ids = AccountPolicy::Scope.new(user, Account).resolve.select(:id)
      scope.where(account_id: account_ids)
    end
  end

  private

  def household_member?
    return false unless user&.household

    record.account&.household_id == user.household.id
  end
end

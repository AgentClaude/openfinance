# frozen_string_literal: true

class BudgetItemPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless household

      scope.joins(:budget).where(budgets: { household_id: household.id })
    end
  end
end

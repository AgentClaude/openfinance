# frozen_string_literal: true

class TransactionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless household

      account_ids = AccountPolicy::Scope.new(user, Account).resolve.select(:id)
      scope.where(account_id: account_ids)
    end
  end
end

# frozen_string_literal: true

class AccountPolicy < ApplicationPolicy
  def show?
    owned_or_shared?
  end

  def update?
    owned? || shared_with_permission?('edit')
  end

  def destroy?
    owned?
  end

  def share?
    owned?
  end

  private

  def owned?
    record.household_id == household&.id
  end

  def owned_or_shared?
    owned? || SharedAccount.exists?(account_id: record.id, shared_with_user_id: user.id)
  end

  def shared_with_permission?(level)
    levels = case level
             when 'view' then %w[view edit admin]
             when 'edit' then %w[edit admin]
             when 'admin' then %w[admin]
             else []
             end
    SharedAccount.exists?(account_id: record.id, shared_with_user_id: user.id, permission_level: levels)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      household_ids = [household&.id].compact
      shared_account_ids = SharedAccount.where(shared_with_user_id: user.id).select(:account_id)

      scope.where(household_id: household_ids).or(scope.where(id: shared_account_ids))
    end
  end
end

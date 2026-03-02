# frozen_string_literal: true

class MerchantMappingPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless household
      scope.where(household_id: household.id)
    end
  end
end

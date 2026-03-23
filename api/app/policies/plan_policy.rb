# frozen_string_literal: true

class PlanPolicy < ApplicationPolicy
  # Plans are public — anyone can view them
  def show?
    true
  end

  def index?
    true
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.active.ordered
    end
  end
end

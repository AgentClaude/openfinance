class GoalAccount < ApplicationRecord
  belongs_to :goal
  belongs_to :account

  validates :goal_id, uniqueness: { scope: :account_id }
end

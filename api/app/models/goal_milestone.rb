# GoalMilestone model for OpenFinance
# Tracks milestone achievements for financial goals (25%, 50%, 75%, 100%)

class GoalMilestone < ApplicationRecord
  MILESTONE_PERCENTAGES = [25, 50, 75, 100].freeze

  # Associations
  belongs_to :goal

  # Validations
  validates :goal, presence: true
  validates :percentage, presence: true, inclusion: { in: MILESTONE_PERCENTAGES }
  validates :amount_at_milestone_cents, presence: true, numericality: { greater_than: 0 }
  validates :achieved_at, presence: true
  validates :percentage, uniqueness: { scope: :goal_id }

  # Scopes
  scope :ordered, -> { order(:percentage) }
  scope :recent_first, -> { order(achieved_at: :desc) }

  # Helpers
  def amount_at_milestone
    amount_at_milestone_cents / 100.0
  end

  def label
    case percentage
    when 25 then "Quarter way there!"
    when 50 then "Halfway there!"
    when 75 then "Almost there!"
    when 100 then "Goal achieved! 🎉"
    end
  end

  def emoji
    case percentage
    when 25 then "🌱"
    when 50 then "⚡"
    when 75 then "🔥"
    when 100 then "🎉"
    end
  end
end

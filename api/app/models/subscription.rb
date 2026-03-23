# Subscription model for OpenFinance
# Represents a household's subscription to a Plan

class Subscription < ApplicationRecord
  # Associations
  belongs_to :household
  belongs_to :plan

  # Validations
  validates :status, presence: true, inclusion: {
    in: %w[trialing active past_due canceled unpaid incomplete]
  }
  validates :billing_interval, inclusion: { in: %w[monthly annual] }
  validates :household_id, uniqueness: true

  # Scopes
  scope :active_or_trialing, -> { where(status: %w[trialing active]) }
  scope :past_due, -> { where(status: 'past_due') }
  scope :canceled, -> { where(status: 'canceled') }

  # Status helpers
  def active?
    status == 'active'
  end

  def trialing?
    status == 'trialing'
  end

  def past_due?
    status == 'past_due'
  end

  def canceled?
    status == 'canceled'
  end

  def will_cancel?
    cancel_at_period_end? || cancel_at.present?
  end

  def trial_active?
    trialing? && trial_ends_at.present? && trial_ends_at > Time.current
  end

  def trial_days_remaining
    return 0 unless trial_active?
    ((trial_ends_at - Time.current) / 1.day).ceil
  end

  def days_until_renewal
    return nil unless current_period_end.present?
    ((current_period_end - Time.current) / 1.day).ceil
  end

  # Feature access (delegated to plan)
  def can_access?(feature)
    return true if plan.nil? # Fallback: allow everything if no plan
    case feature.to_sym
    when :reports then plan.has_reports
    when :budgets then plan.has_budgets
    when :goals then plan.has_goals
    when :investments then plan.has_investments
    when :recurring then plan.has_recurring
    when :csv_import then plan.has_csv_import
    when :api_access then plan.has_api_access
    when :collaboration then plan.has_collaboration
    when :priority_support then plan.has_priority_support
    else true
    end
  end

  def account_limit
    plan&.max_accounts || 2
  end

  def transaction_limit
    plan&.max_transactions || 500
  end

  # Cancel subscription
  def cancel!(at_period_end: true)
    if at_period_end
      update!(cancel_at_period_end: true, cancel_at: current_period_end)
    else
      update!(status: 'canceled', canceled_at: Time.current)
    end
  end

  # Reactivate a canceled subscription (before period end)
  def reactivate!
    return unless cancel_at_period_end?
    update!(cancel_at_period_end: false, cancel_at: nil)
  end
end

# frozen_string_literal: true

class ActivityEvent < ApplicationRecord
  belongs_to :household
  belongs_to :user

  validates :action, presence: true, inclusion: {
    in: %w[
      categorized created updated deleted split
      invited joined budget_set budget_copied budget_filled
      goal_created goal_updated rule_created rule_applied
      recurring_detected marked_paid transfer_linked
      account_added account_removed
    ]
  }
  validates :resource_type, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_household, ->(hh) { where(household: hh) }
  scope :since, ->(time) { where('created_at >= ?', time) }

  # Human-readable description of the event
  def description
    case action
    when 'categorized'
      "categorized a transaction as #{metadata['category_name'] || 'unknown'}"
    when 'created'
      "added a new #{resource_type.underscore.humanize.downcase}"
    when 'updated'
      "updated a #{resource_type.underscore.humanize.downcase}"
    when 'deleted'
      "deleted a #{resource_type.underscore.humanize.downcase}"
    when 'split'
      "split a transaction"
    when 'invited'
      "invited #{metadata['email']} to the household"
    when 'joined'
      "joined the household"
    when 'budget_set'
      "set budget for #{metadata['category_name']} to #{metadata['amount']}"
    when 'budget_copied'
      "copied budget from #{metadata['source_month']}"
    when 'budget_filled'
      "filled budget from averages"
    when 'goal_created'
      "created goal: #{metadata['goal_name']}"
    when 'goal_updated'
      "updated goal: #{metadata['goal_name']}"
    when 'rule_created'
      "created categorization rule"
    when 'rule_applied'
      "applied categorization rules (#{metadata['count']} transactions affected)"
    when 'recurring_detected'
      "detected #{metadata['count']} recurring transactions"
    when 'marked_paid'
      "marked #{metadata['item_name']} as paid"
    when 'transfer_linked'
      "linked a transfer"
    when 'account_added'
      "added account: #{metadata['account_name']}"
    when 'account_removed'
      "removed account: #{metadata['account_name']}"
    else
      "performed #{action} on #{resource_type.underscore.humanize.downcase}"
    end
  end

  # Convenience class method for logging activity
  def self.log(user:, action:, resource:, metadata: {})
    return unless user&.household

    create!(
      household: user.household,
      user: user,
      action: action,
      resource_type: resource.is_a?(String) ? resource : resource.class.name,
      resource_id: resource.is_a?(String) ? nil : resource.id,
      metadata: metadata
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.warn("Failed to log activity event: #{e.message}")
  end
end

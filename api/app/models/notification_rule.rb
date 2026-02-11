class NotificationRule < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :household

  # Validations
  validates :name, presence: true, length: { minimum: 1, maximum: 100 }
  validates :rule_type, presence: true
  validates :conditions, presence: true
  validates :name, uniqueness: { scope: [:user_id, :household_id] }

  # Enums
  enum :rule_type, {
    budget_exceeded: 'budget_exceeded',
    large_transaction: 'large_transaction', 
    low_balance: 'low_balance',
    unusual_merchant: 'unusual_merchant',
    duplicate_transaction: 'duplicate_transaction',
    goal_milestone: 'goal_milestone',
    account_sync_failed: 'account_sync_failed',
    spending_spike: 'spending_spike',
    income_received: 'income_received'
  }

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :by_type, ->(type) { where(rule_type: type) }
  scope :for_household, ->(household) { where(household: household) }

  # Callbacks
  before_validation :set_default_settings
  before_save :validate_conditions_format

  # Instance methods
  def evaluate_transaction(transaction)
    return false unless is_active?
    return false unless transaction.household_id == household_id

    case rule_type
    when 'large_transaction'
      evaluate_large_transaction(transaction)
    when 'low_balance'
      evaluate_low_balance(transaction)
    when 'unusual_merchant'
      evaluate_unusual_merchant(transaction)
    when 'duplicate_transaction'
      evaluate_duplicate_transaction(transaction)
    when 'spending_spike'
      evaluate_spending_spike(transaction)
    when 'income_received'
      evaluate_income_received(transaction)
    else
      false
    end
  end

  def evaluate_budget(budget_item, actual_spending)
    return false unless is_active?
    return false unless rule_type == 'budget_exceeded'
    return false unless budget_item.budget.household_id == household_id

    threshold_percentage = conditions.dig('threshold_percentage') || 100
    budget_amount = budget_item.amount_cents
    threshold_amount = (budget_amount * threshold_percentage / 100.0).to_i

    actual_spending >= threshold_amount
  end

  def evaluate_goal(goal)
    return false unless is_active?
    return false unless rule_type == 'goal_milestone'
    return false unless goal.household_id == household_id

    milestone_percentages = conditions.dig('milestone_percentages') || [25, 50, 75, 100]
    current_percentage = (goal.current_amount_cents.to_f / goal.target_amount_cents * 100).round(1)

    milestone_percentages.any? do |milestone|
      # Check if we've just crossed this milestone
      previous_percentage = ((goal.current_amount_cents - goal.last_contribution_cents) / goal.target_amount_cents * 100).round(1)
      previous_percentage < milestone && current_percentage >= milestone
    end
  end

  def create_notification_for_transaction(transaction)
    case rule_type
    when 'large_transaction'
      create_large_transaction_notification(transaction)
    when 'low_balance'
      create_low_balance_notification(transaction)
    when 'unusual_merchant'
      create_unusual_merchant_notification(transaction)
    when 'duplicate_transaction'
      create_duplicate_transaction_notification(transaction)
    when 'spending_spike'
      create_spending_spike_notification(transaction)
    when 'income_received'
      create_income_received_notification(transaction)
    end
  end

  def create_notification_for_budget(budget_item, actual_spending)
    return unless rule_type == 'budget_exceeded'

    Notification.create!(
      user: user,
      household: household,
      title: "Budget Alert: #{budget_item.category.name}",
      body: "You've spent $#{actual_spending/100.0} of your $#{budget_item.amount_cents/100.0} budget for #{budget_item.category.name}.",
      notification_type: 'budget_alert',
      priority: determine_priority,
      data: {
        rule_id: id,
        budget_item_id: budget_item.id,
        category_id: budget_item.category_id,
        actual_spending: actual_spending,
        budget_amount: budget_item.amount_cents
      }
    )
  end

  def create_notification_for_goal(goal, milestone_percentage)
    return unless rule_type == 'goal_milestone'

    Notification.create!(
      user: user,
      household: household,
      title: "Goal Milestone Reached!",
      body: "You've reached #{milestone_percentage}% of your goal '#{goal.name}'! Current progress: $#{goal.current_amount_cents/100.0} of $#{goal.target_amount_cents/100.0}.",
      notification_type: 'goal_progress',
      priority: 'normal',
      data: {
        rule_id: id,
        goal_id: goal.id,
        milestone_percentage: milestone_percentage,
        current_amount: goal.current_amount_cents,
        target_amount: goal.target_amount_cents
      }
    )
  end

  # Configuration helpers
  def self.create_default_rules_for_user(user)
    household = user.household
    return unless household

    default_rules = [
      {
        name: 'Large Transaction Alert',
        rule_type: 'large_transaction',
        conditions: { amount_threshold_cents: 50000 }, # $500
        settings: { priority: 'high' }
      },
      {
        name: 'Low Balance Warning',
        rule_type: 'low_balance',
        conditions: { balance_threshold_cents: 10000 }, # $100
        settings: { priority: 'normal' }
      },
      {
        name: 'Budget Exceeded',
        rule_type: 'budget_exceeded',
        conditions: { threshold_percentage: 90 },
        settings: { priority: 'normal' }
      },
      {
        name: 'Goal Milestones',
        rule_type: 'goal_milestone',
        conditions: { milestone_percentages: [25, 50, 75, 100] },
        settings: { priority: 'normal' }
      }
    ]

    default_rules.each do |rule_config|
      create!(
        user: user,
        household: household,
        name: rule_config[:name],
        rule_type: rule_config[:rule_type],
        conditions: rule_config[:conditions],
        settings: rule_config[:settings]
      )
    end
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :name, :rule_type, :is_active, :conditions, :settings, :created_at, :updated_at]
    ))
  end

  private

  def evaluate_large_transaction(transaction)
    threshold = conditions.dig('amount_threshold_cents') || 50000
    transaction.amount_cents.abs >= threshold
  end

  def evaluate_low_balance(transaction)
    threshold = conditions.dig('balance_threshold_cents') || 10000
    transaction.account.current_balance_cents <= threshold
  end

  def evaluate_unusual_merchant(transaction)
    # Check if this is a merchant we haven't seen in the last 6 months
    lookback_period = conditions.dig('lookback_months') || 6
    
    household.transactions
             .where('date > ?', lookback_period.months.ago)
             .where.not(id: transaction.id)
             .where(merchant_name: transaction.merchant_name)
             .empty?
  end

  def evaluate_duplicate_transaction(transaction)
    # Look for potential duplicates within the last 7 days
    time_window = conditions.dig('time_window_days') || 7
    amount_tolerance = conditions.dig('amount_tolerance_cents') || 100

    household.transactions
             .where(account: transaction.account)
             .where('date BETWEEN ? AND ?', 
                    transaction.date - time_window.days, 
                    transaction.date + time_window.days)
             .where('amount_cents BETWEEN ? AND ?',
                    transaction.amount_cents - amount_tolerance,
                    transaction.amount_cents + amount_tolerance)
             .where.not(id: transaction.id)
             .exists?
  end

  def evaluate_spending_spike(transaction)
    return false if transaction.amount_cents >= 0 # Only for expenses

    # Compare to average spending for this category
    avg_window = conditions.dig('average_window_days') || 30
    spike_multiplier = conditions.dig('spike_multiplier') || 3

    avg_spending = household.transactions
                            .where(category: transaction.category)
                            .where('date > ?', avg_window.days.ago)
                            .where('amount_cents < 0')
                            .average(:amount_cents) || 0

    return false if avg_spending >= 0 # No historical spending data

    transaction.amount_cents.abs >= (avg_spending.abs * spike_multiplier)
  end

  def evaluate_income_received(transaction)
    return false if transaction.amount_cents <= 0 # Only for income

    threshold = conditions.dig('minimum_amount_cents') || 0
    transaction.amount_cents >= threshold
  end

  def create_large_transaction_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Large Transaction Detected',
      body: "A large transaction of $#{transaction.amount.abs} was recorded for #{transaction.account.name}: #{transaction.name}",
      notification_type: 'large_transaction',
      priority: determine_priority,
      data: {
        rule_id: id,
        transaction_id: transaction.id,
        account_id: transaction.account_id,
        amount: transaction.amount_cents
      }
    )
  end

  def create_low_balance_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Low Balance Alert',
      body: "Your #{transaction.account.name} account has a low balance: $#{transaction.account.current_balance}",
      notification_type: 'low_balance',
      priority: determine_priority,
      data: {
        rule_id: id,
        account_id: transaction.account_id,
        current_balance: transaction.account.current_balance_cents
      }
    )
  end

  def create_unusual_merchant_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Unusual Merchant',
      body: "New merchant detected: #{transaction.merchant_name} - $#{transaction.amount.abs}",
      notification_type: 'transaction_alert',
      priority: 'normal',
      data: {
        rule_id: id,
        transaction_id: transaction.id,
        merchant_name: transaction.merchant_name
      }
    )
  end

  def create_duplicate_transaction_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Possible Duplicate Transaction',
      body: "Potential duplicate: #{transaction.name} - $#{transaction.amount.abs} on #{transaction.account.name}",
      notification_type: 'transaction_alert',
      priority: 'normal',
      data: {
        rule_id: id,
        transaction_id: transaction.id
      }
    )
  end

  def create_spending_spike_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Spending Spike Detected',
      body: "Unusual spending in #{transaction.category.name}: #{transaction.name} - $#{transaction.amount.abs}",
      notification_type: 'transaction_alert',
      priority: 'normal',
      data: {
        rule_id: id,
        transaction_id: transaction.id,
        category_id: transaction.category_id
      }
    )
  end

  def create_income_received_notification(transaction)
    Notification.create!(
      user: user,
      household: household,
      title: 'Income Received',
      body: "Income of $#{transaction.amount} received in #{transaction.account.name}: #{transaction.name}",
      notification_type: 'transaction_alert',
      priority: 'normal',
      data: {
        rule_id: id,
        transaction_id: transaction.id,
        account_id: transaction.account_id
      }
    )
  end

  def determine_priority
    settings.dig('priority') || 'normal'
  end

  def set_default_settings
    self.settings ||= {}
    self.settings['priority'] ||= 'normal'
  end

  def validate_conditions_format
    return if conditions.blank?

    case rule_type
    when 'large_transaction'
      errors.add(:conditions, 'must include amount_threshold_cents') unless conditions.key?('amount_threshold_cents')
    when 'low_balance'
      errors.add(:conditions, 'must include balance_threshold_cents') unless conditions.key?('balance_threshold_cents')
    when 'budget_exceeded'
      errors.add(:conditions, 'must include threshold_percentage') unless conditions.key?('threshold_percentage')
    end
  end
end
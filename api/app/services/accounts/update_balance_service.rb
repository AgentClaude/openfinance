class Accounts::UpdateBalanceService < ApplicationService
  attr_accessor :account, :new_balance, :date, :available_balance, :credit_limit

  validates :account, presence: true
  validates :new_balance, presence: true, numericality: true
  validate :validate_balance_change

  def initialize(account:, new_balance:, date: nil, available_balance: nil, credit_limit: nil, **args)
    @account = account
    @new_balance = new_balance
    @date = date || Date.current
    @available_balance = available_balance
    @credit_limit = credit_limit
    super(**args)
  end

  def call
    return validation_failure(self) unless valid?

    begin
      previous_balance = account.current_balance_cents
      
      update_account_balance
      create_balance_history_record
      check_balance_alerts
      
      success(
        account: account.reload,
        previous_balance: Money.new(previous_balance, account.currency),
        new_balance: Money.new(new_balance_cents, account.currency),
        balance_change: Money.new(new_balance_cents - previous_balance, account.currency)
      )
    rescue StandardError => e
      Rails.logger.error "UpdateBalanceService failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      failure("Failed to update balance: #{e.message}")
    end
  end

  private

  def new_balance_cents
    @new_balance_cents ||= monetize_amount(new_balance)
  end

  def available_balance_cents
    return nil if available_balance.blank?
    
    @available_balance_cents ||= monetize_amount(available_balance)
  end

  def credit_limit_cents
    return nil if credit_limit.blank?
    
    @credit_limit_cents ||= monetize_amount(credit_limit)
  end

  def monetize_amount(amount)
    case amount
    when Money
      amount.cents
    when String
      cleaned_amount = amount.gsub(/[$,]/, '').strip
      (cleaned_amount.to_f * 100).to_i
    when Numeric
      (amount.to_f * 100).to_i
    else
      raise ArgumentError, "Invalid amount format: #{amount}"
    end
  end

  def validate_balance_change
    return unless account && new_balance

    # For credit accounts, available balance can't exceed credit limit
    if account.account_type == 'credit'
      if credit_limit_cents.present? && available_balance_cents.present?
        if available_balance_cents > credit_limit_cents
          errors.add(:available_balance, "cannot exceed credit limit")
        end
      end
    end

    # For depository accounts, available balance can't exceed current balance
    if account.account_type == 'depository'
      if available_balance_cents.present? && available_balance_cents > new_balance_cents
        errors.add(:available_balance, "cannot exceed current balance")
      end
    end

    # Check for unreasonable balance changes (configurable threshold)
    if account.current_balance_cents.present?
      balance_change = (new_balance_cents - account.current_balance_cents).abs
      max_reasonable_change = 1_000_000_00 # $1M in cents
      
      if balance_change > max_reasonable_change
        Rails.logger.warn "Large balance change detected for account #{account.id}: #{balance_change / 100.0}"
      end
    end
  end

  def update_account_balance
    update_attrs = {
      current_balance_cents: new_balance_cents
    }

    update_attrs[:available_balance_cents] = available_balance_cents if available_balance_cents.present?
    update_attrs[:credit_limit_cents] = credit_limit_cents if credit_limit_cents.present?

    account.update!(update_attrs)
  end

  def create_balance_history_record
    # Only create a new record if the balance actually changed or it's a new date
    existing_record = AccountBalanceHistory.find_by(account: account, date: @date)
    
    if existing_record
      # Update existing record for the same date
      existing_record.update!(
        current_balance_cents: new_balance_cents,
        available_balance_cents: available_balance_cents || existing_record.available_balance_cents,
        credit_limit_cents: credit_limit_cents || existing_record.credit_limit_cents
      )
    else
      # Create new record
      AccountBalanceHistory.create!(
        account: account,
        date: @date,
        current_balance_cents: new_balance_cents,
        available_balance_cents: available_balance_cents || account.available_balance_cents,
        credit_limit_cents: credit_limit_cents || account.credit_limit_cents,
        currency: account.currency
      )
    end
  end

  def check_balance_alerts
    # Check for low balance alerts
    household_members = account.household.all_members
    
    household_members.each do |user|
      check_low_balance_alerts(user)
      check_credit_utilization_alerts(user) if account.account_type == 'credit'
    end
  end

  def check_low_balance_alerts(user)
    return unless account.account_type == 'depository'

    low_balance_rules = user.notification_rules
                           .active
                           .where(rule_type: 'low_balance')

    low_balance_rules.each do |rule|
      threshold_cents = rule.conditions.dig('balance_threshold_cents') || 10000 # $100 default
      
      if new_balance_cents <= threshold_cents && 
         (account.current_balance_cents.nil? || account.current_balance_cents > threshold_cents)
        
        create_low_balance_notification(user, threshold_cents)
      end
    end
  end

  def check_credit_utilization_alerts(user)
    return unless account.account_type == 'credit'
    return unless account.credit_limit_cents&.positive?

    utilization_percentage = (new_balance_cents.abs.to_f / account.credit_limit_cents * 100).round(1)
    
    utilization_rules = user.notification_rules
                           .active
                           .where(rule_type: 'high_credit_utilization')

    utilization_rules.each do |rule|
      threshold_percentage = rule.conditions.dig('utilization_threshold_percentage') || 80
      
      if utilization_percentage >= threshold_percentage
        create_credit_utilization_notification(user, utilization_percentage)
      end
    end
  end

  def create_low_balance_notification(user, threshold_cents)
    Notification.create!(
      user: user,
      household: account.household,
      title: 'Low Balance Alert',
      body: "Your #{account.name} account balance (#{account.current_balance.format}) is below your threshold of #{Money.new(threshold_cents, account.currency).format}.",
      notification_type: 'low_balance',
      priority: 'normal',
      data: {
        account_id: account.id,
        current_balance: new_balance_cents,
        threshold: threshold_cents
      }
    )
  end

  def create_credit_utilization_notification(user, utilization_percentage)
    Notification.create!(
      user: user,
      household: account.household,
      title: 'High Credit Utilization',
      body: "Your #{account.name} credit utilization is #{utilization_percentage}%. Current balance: #{account.current_balance.format} of #{account.credit_limit.format} limit.",
      notification_type: 'transaction_alert',
      priority: 'normal',
      data: {
        account_id: account.id,
        utilization_percentage: utilization_percentage,
        current_balance: new_balance_cents,
        credit_limit: account.credit_limit_cents
      }
    )
  end
end
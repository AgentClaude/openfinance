class Transactions::CreateService < ApplicationService
  attr_accessor :household, :params

  validates :household, presence: true
  validates :params, presence: true
  validate :validate_params_structure

  def call
    return validation_failure(self) unless valid?

    begin
      ActiveRecord::Base.transaction do
        transaction = build_transaction
        
        if transaction.save
          auto_categorize_transaction(transaction)
          update_account_balance(transaction)
          check_transaction_alerts(transaction)
          
          success(transaction: transaction.reload)
        else
          validation_failure(transaction)
        end
      end
    rescue StandardError => e
      Rails.logger.error "CreateTransactionService failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      failure("Failed to create transaction: #{e.message}")
    end
  end

  private

  def build_transaction
    household.transactions.build(transaction_params)
  end

  def transaction_params
    {
      account: find_account,
      category: find_category,
      date: parse_date(params[:date]),
      amount_cents: monetize_amount(params[:amount]),
      currency: params[:currency] || household.currency || 'USD',
      name: params[:name].to_s.strip,
      merchant_name: params[:merchant_name]&.strip,
      notes: params[:notes]&.strip,
      is_pending: params[:is_pending] || false,
      needs_review: params[:needs_review] || false,
      is_recurring: params[:is_recurring] || false,
      metadata: params[:metadata] || {}
    }
  end

  def validate_params_structure
    required_fields = %i[account_id amount name date]
    required_fields.each do |field|
      errors.add(:params, "#{field} is required") if params[field].blank?
    end

    # Validate account exists and belongs to household
    if params[:account_id].present?
      account = household.accounts.find_by(id: params[:account_id])
      errors.add(:params, "account not found or not accessible") unless account
    end

    # Validate amount format
    if params[:amount].present?
      begin
        monetize_amount(params[:amount])
      rescue ArgumentError => e
        errors.add(:params, "invalid amount format: #{e.message}")
      end
    end

    # Validate date format
    if params[:date].present?
      begin
        parse_date(params[:date])
      rescue ArgumentError
        errors.add(:params, "invalid date format")
      end
    end

    # Validate category if provided
    if params[:category_id].present?
      category = household.categories.find_by(id: params[:category_id])
      errors.add(:params, "category not found or not accessible") unless category
    end

    # Validate currency
    if params[:currency].present? && params[:currency].length != 3
      errors.add(:params, "currency must be a 3-letter ISO code")
    end
  end

  def find_account
    household.accounts.find(params[:account_id])
  end

  def find_category
    return nil if params[:category_id].blank?
    
    household.categories.find_by(id: params[:category_id])
  end

  def monetize_amount(amount)
    case amount
    when String
      cleaned_amount = amount.gsub(/[$,]/, '').strip
      (cleaned_amount.to_f * 100).to_i
    when Numeric
      (amount.to_f * 100).to_i
    when Money
      amount.cents
    else
      raise ArgumentError, "Invalid amount format: #{amount.class}"
    end
  end

  def parse_date(date_input)
    case date_input
    when Date
      date_input
    when String
      Date.parse(date_input)
    when Time, DateTime
      date_input.to_date
    else
      raise ArgumentError, "Invalid date format: #{date_input.class}"
    end
  end

  def auto_categorize_transaction(transaction)
    return if transaction.category.present?

    result = Transactions::AutoCategorizeService.call(transaction: transaction)
    
    if result.success? && result.data[:category]
      transaction.update!(category: result.data[:category])
    else
      # Mark for manual review if auto-categorization fails
      transaction.update!(needs_review: true)
    end
  end

  def update_account_balance(transaction)
    return if transaction.is_pending?

    account = transaction.account
    new_balance_cents = account.current_balance_cents + transaction.amount_cents

    Accounts::UpdateBalanceService.call(
      account: account,
      new_balance: Money.new(new_balance_cents, account.currency),
      date: transaction.date
    )
  end

  def check_transaction_alerts(transaction)
    household.all_members.each do |user|
      check_large_transaction_alerts(user, transaction)
      check_duplicate_transaction_alerts(user, transaction)
      check_unusual_merchant_alerts(user, transaction)
      check_spending_spike_alerts(user, transaction)
    end
  end

  def check_large_transaction_alerts(user, transaction)
    large_transaction_rules = user.notification_rules
                                 .active
                                 .where(rule_type: 'large_transaction')

    large_transaction_rules.each do |rule|
      if rule.evaluate_transaction(transaction)
        rule.create_notification_for_transaction(transaction)
      end
    end
  end

  def check_duplicate_transaction_alerts(user, transaction)
    duplicate_rules = user.notification_rules
                         .active
                         .where(rule_type: 'duplicate_transaction')

    duplicate_rules.each do |rule|
      if rule.evaluate_transaction(transaction)
        rule.create_notification_for_transaction(transaction)
      end
    end
  end

  def check_unusual_merchant_alerts(user, transaction)
    return if transaction.merchant_name.blank?

    unusual_merchant_rules = user.notification_rules
                                .active
                                .where(rule_type: 'unusual_merchant')

    unusual_merchant_rules.each do |rule|
      if rule.evaluate_transaction(transaction)
        rule.create_notification_for_transaction(transaction)
      end
    end
  end

  def check_spending_spike_alerts(user, transaction)
    return if transaction.amount_cents >= 0 # Only for expenses
    return if transaction.category.blank?

    spending_spike_rules = user.notification_rules
                              .active
                              .where(rule_type: 'spending_spike')

    spending_spike_rules.each do |rule|
      if rule.evaluate_transaction(transaction)
        rule.create_notification_for_transaction(transaction)
      end
    end
  end
end
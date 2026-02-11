class Transactions::UpdateService < ApplicationService
  attr_accessor :transaction, :params

  validates :transaction, presence: true
  validates :params, presence: true
  validate :validate_update_permissions
  validate :validate_params_structure

  def call
    return validation_failure(self) unless valid?

    begin
      previous_values = capture_previous_values

      ActiveRecord::Base.transaction do
        if transaction.update!(update_params)
          handle_balance_adjustments(previous_values)
          handle_category_change(previous_values)
          handle_pending_status_change(previous_values)
          
          success(transaction: transaction.reload, previous_values: previous_values)
        else
          validation_failure(transaction)
        end
      end
    rescue StandardError => e
      Rails.logger.error "UpdateTransactionService failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      failure("Failed to update transaction: #{e.message}")
    end
  end

  private

  def update_params
    allowed_params = {}

    # Core transaction fields
    allowed_params[:name] = params[:name].strip if params[:name].present?
    allowed_params[:merchant_name] = params[:merchant_name]&.strip if params.key?(:merchant_name)
    allowed_params[:notes] = params[:notes]&.strip if params.key?(:notes)
    allowed_params[:needs_review] = params[:needs_review] if params.key?(:needs_review)
    allowed_params[:is_recurring] = params[:is_recurring] if params.key?(:is_recurring)

    # Amount (requires special handling)
    if params[:amount].present?
      allowed_params[:amount_cents] = monetize_amount(params[:amount])
    end

    # Date (requires special handling)
    if params[:date].present?
      allowed_params[:date] = parse_date(params[:date])
    end

    # Category change
    if params.key?(:category_id)
      if params[:category_id].present?
        category = transaction.household.categories.find_by(id: params[:category_id])
        allowed_params[:category] = category if category
      else
        allowed_params[:category] = nil
      end
    end

    # Pending status (affects balance calculations)
    if params.key?(:is_pending)
      allowed_params[:is_pending] = params[:is_pending]
    end

    # Account change (requires special validation)
    if params[:account_id].present? && params[:account_id] != transaction.account_id
      new_account = transaction.household.accounts.find_by(id: params[:account_id])
      allowed_params[:account] = new_account if new_account
    end

    # Metadata
    if params[:metadata].present?
      allowed_params[:metadata] = (transaction.metadata || {}).merge(params[:metadata])
    end

    allowed_params
  end

  def validate_update_permissions
    return unless transaction

    # Check if transaction can be modified (not from external source unless explicitly allowed)
    if transaction.plaid_transaction_id.present? && !params[:allow_external_update]
      errors.add(:transaction, "cannot modify externally synchronized transactions")
    end

    # Check if transaction is too old to modify (configurable business rule)
    if transaction.date < 90.days.ago && !params[:allow_historical_update]
      errors.add(:transaction, "cannot modify transactions older than 90 days")
    end
  end

  def validate_params_structure
    # Validate amount format if provided
    if params[:amount].present?
      begin
        monetize_amount(params[:amount])
      rescue ArgumentError => e
        errors.add(:params, "invalid amount format: #{e.message}")
      end
    end

    # Validate date format if provided
    if params[:date].present?
      begin
        parse_date(params[:date])
      rescue ArgumentError
        errors.add(:params, "invalid date format")
      end
    end

    # Validate category exists and belongs to household
    if params[:category_id].present?
      category = transaction.household.categories.find_by(id: params[:category_id])
      errors.add(:params, "category not found or not accessible") unless category
    end

    # Validate account exists and belongs to household
    if params[:account_id].present?
      account = transaction.household.accounts.find_by(id: params[:account_id])
      errors.add(:params, "account not found or not accessible") unless account
    end

    # Validate name length
    if params[:name].present? && params[:name].length > 255
      errors.add(:params, "name is too long (maximum 255 characters)")
    end
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

  def capture_previous_values
    {
      amount_cents: transaction.amount_cents,
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      date: transaction.date,
      is_pending: transaction.is_pending,
      name: transaction.name,
      merchant_name: transaction.merchant_name
    }
  end

  def handle_balance_adjustments(previous_values)
    amount_changed = previous_values[:amount_cents] != transaction.amount_cents
    account_changed = previous_values[:account_id] != transaction.account_id
    pending_changed = previous_values[:is_pending] != transaction.is_pending
    
    return unless amount_changed || account_changed || pending_changed

    if account_changed
      # Reverse the transaction from the old account
      old_account = Account.find(previous_values[:account_id])
      adjust_account_balance(old_account, -previous_values[:amount_cents], previous_values[:is_pending])
      
      # Apply the transaction to the new account
      adjust_account_balance(transaction.account, transaction.amount_cents, transaction.is_pending)
    elsif amount_changed || pending_changed
      # Adjust the current account for the difference
      old_impact = previous_values[:is_pending] ? 0 : previous_values[:amount_cents]
      new_impact = transaction.is_pending? ? 0 : transaction.amount_cents
      difference = new_impact - old_impact
      
      adjust_account_balance(transaction.account, difference, false) if difference != 0
    end
  end

  def handle_category_change(previous_values)
    return unless previous_values[:category_id] != transaction.category_id

    # Check budget implications
    check_budget_impact_after_category_change(previous_values)

    # Run auto-categorization rules to learn from manual categorization
    if transaction.category.present? && previous_values[:category_id].nil?
      learn_from_categorization
    end
  end

  def handle_pending_status_change(previous_values)
    return unless previous_values[:is_pending] != transaction.is_pending

    # Log pending status changes for audit trail
    Rails.logger.info "Transaction #{transaction.id} pending status changed: #{previous_values[:is_pending]} -> #{transaction.is_pending}"

    # Update needs_review flag if transaction is no longer pending
    if previous_values[:is_pending] && !transaction.is_pending
      transaction.update_column(:needs_review, false) unless params.key?(:needs_review)
    end
  end

  def adjust_account_balance(account, amount_cents, was_pending)
    return if was_pending # Pending transactions don't affect balance

    new_balance_cents = account.current_balance_cents + amount_cents

    Accounts::UpdateBalanceService.call(
      account: account,
      new_balance: Money.new(new_balance_cents, account.currency),
      date: transaction.date
    )
  end

  def check_budget_impact_after_category_change(previous_values)
    # Check budget alerts for both old and new categories
    household = transaction.household
    current_budget = household.current_budget
    return unless current_budget

    [previous_values[:category_id], transaction.category_id].compact.uniq.each do |category_id|
      next unless category_id

      category = Category.find_by(id: category_id)
      next unless category

      budget_item = current_budget.budget_items.find_by(
        category: category,
        month: transaction.date.beginning_of_month
      )
      next unless budget_item

      actual_spending = calculate_category_spending(category, transaction.date.beginning_of_month)
      
      household.all_members.each do |user|
        budget_rules = user.notification_rules.active.where(rule_type: 'budget_exceeded')
        
        budget_rules.each do |rule|
          if rule.evaluate_budget(budget_item, actual_spending)
            rule.create_notification_for_budget(budget_item, actual_spending)
          end
        end
      end
    end
  end

  def calculate_category_spending(category, month_start)
    month_end = month_start.end_of_month
    
    transaction.household.transactions
               .where(category: category)
               .where(date: month_start..month_end)
               .where(is_pending: false)
               .where('amount_cents < 0') # Only expenses
               .sum(:amount_cents)
               .abs
  end

  def learn_from_categorization
    # This could be expanded to update categorization rules based on manual categorization
    # For now, just log the learning opportunity
    Rails.logger.info "Manual categorization for transaction #{transaction.id}: '#{transaction.name}' -> #{transaction.category.name}"
    
    # Future: Update or create categorization rules based on merchant, amount patterns, etc.
  end
end
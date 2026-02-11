class Accounts::CreateManualAccountService < ApplicationService
  attr_accessor :household, :params

  validates :household, presence: true
  validates :params, presence: true
  validate :validate_params_structure

  def call
    return validation_failure(self) unless valid?

    begin
      account = household.accounts.build(account_params)
      account.is_manual = true
      account.display_order = next_display_order

      if account.save
        create_initial_balance_history(account)
        success(account: account)
      else
        validation_failure(account)
      end
    rescue StandardError => e
      Rails.logger.error "CreateManualAccountService failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      failure("Failed to create account: #{e.message}")
    end
  end

  private

  def account_params
    {
      name: params[:name],
      account_type: params[:account_type],
      account_subtype: params[:account_subtype],
      current_balance_cents: monetize_amount(params[:current_balance]),
      available_balance_cents: monetize_amount(params[:available_balance]),
      credit_limit_cents: monetize_amount(params[:credit_limit]),
      currency: params[:currency] || household.currency || 'USD',
      official_name: params[:official_name],
      mask: generate_mask(params[:name])
    }
  end

  def validate_params_structure
    required_fields = %i[name account_type]
    required_fields.each do |field|
      errors.add(:params, "#{field} is required") if params[field].blank?
    end

    if params[:account_type].present?
      valid_types = %w[depository credit loan investment other]
      unless valid_types.include?(params[:account_type])
        errors.add(:params, "account_type must be one of: #{valid_types.join(', ')}")
      end
    end

    if params[:current_balance].present?
      begin
        monetize_amount(params[:current_balance])
      rescue ArgumentError
        errors.add(:params, 'current_balance must be a valid number')
      end
    end

    if params[:currency].present? && params[:currency].length != 3
      errors.add(:params, 'currency must be a 3-letter ISO code')
    end
  end

  def monetize_amount(amount)
    return nil if amount.blank?
    
    case amount
    when String
      # Remove currency symbols and commas
      cleaned_amount = amount.gsub(/[$,]/, '').strip
      (cleaned_amount.to_f * 100).to_i
    when Numeric
      (amount.to_f * 100).to_i
    else
      raise ArgumentError, "Invalid amount format: #{amount}"
    end
  end

  def next_display_order
    max_order = household.accounts.maximum(:display_order) || 0
    max_order + 1
  end

  def generate_mask(account_name)
    # Generate a simple mask based on account name
    # This is just for manual accounts to maintain consistency
    suffix = account_name.downcase.gsub(/[^a-z0-9]/, '').last(4)
    "****#{suffix.rjust(4, '0')}"
  end

  def create_initial_balance_history(account)
    return if account.current_balance_cents.nil?

    AccountBalanceHistory.create!(
      account: account,
      date: Date.current,
      current_balance_cents: account.current_balance_cents,
      available_balance_cents: account.available_balance_cents,
      credit_limit_cents: account.credit_limit_cents,
      currency: account.currency
    )
  end
end
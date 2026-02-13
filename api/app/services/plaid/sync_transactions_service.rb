# Service for syncing transactions from Plaid using transactions/sync endpoint

class Plaid::SyncTransactionsService < ApplicationService
  attr_accessor :connection

  validates :connection, presence: true

  def call
    return validation_failure(self) unless valid?
    return failure(['Plaid is not configured']) unless PlaidConfig.enabled?
    return failure(['Connection is not active']) unless connection.active?

    begin
      sync_transactions!
      connection.update!(last_synced_at: Time.current, sync_cursor: @cursor)
      success(
        added: @added_count,
        modified: @modified_count,
        removed: @removed_count
      )
    rescue Plaid::ApiError => e
      handle_plaid_error(e)
    rescue StandardError => e
      Rails.logger.error "Transaction sync failed for connection #{connection.id}: #{e.message}"
      failure(["Failed to sync transactions: #{e.message}"])
    end
  end

  private

  def initialize(connection:)
    @connection = connection
    @added_count = 0
    @modified_count = 0
    @removed_count = 0
    @cursor = connection&.sync_cursor
  end

  def sync_transactions!
    has_more = true

    while has_more
      request = Plaid::TransactionsSyncRequest.new(
        access_token: connection.provider_access_token,
        cursor: @cursor.presence,
        count: 500
      )

      response = PlaidConfig.client.transactions_sync(request)

      process_added(response.added || [])
      process_modified(response.modified || [])
      process_removed(response.removed || [])

      @cursor = response.next_cursor
      has_more = response.has_more
    end
  end

  def process_added(transactions)
    transactions.each do |txn|
      account = find_account(txn.account_id)
      next unless account

      Transaction.find_or_create_by!(plaid_transaction_id: txn.transaction_id) do |t|
        t.account = account
        t.household = connection.household
        t.date = txn.date
        t.amount_cents = (-(txn.amount || 0) * 100).round # Plaid: positive = debit, we want positive = credit
        t.currency = txn.iso_currency_code || 'USD'
        t.name = txn.name
        t.merchant_name = txn.merchant_name
        t.is_pending = txn.pending || false
        t.category = map_category(txn.personal_finance_category)
        t.metadata = { plaid_category: txn.personal_finance_category&.to_hash }
      end
      @added_count += 1
    end
  end

  def process_modified(transactions)
    transactions.each do |txn|
      record = Transaction.find_by(plaid_transaction_id: txn.transaction_id)
      next unless record

      record.update!(
        amount_cents: (-(txn.amount || 0) * 100).round,
        name: txn.name,
        merchant_name: txn.merchant_name,
        is_pending: txn.pending || false,
        date: txn.date
      )
      @modified_count += 1
    end
  end

  def process_removed(transactions)
    transaction_ids = transactions.map { |t| t.transaction_id }
    @removed_count = Transaction.where(plaid_transaction_id: transaction_ids).delete_all
  end

  def find_account(plaid_account_id)
    connection.accounts.find_by(plaid_account_id: plaid_account_id)
  end

  def map_category(personal_finance_category)
    return nil unless personal_finance_category

    primary = personal_finance_category['primary']&.downcase
    household = connection.household

    # Try to map Plaid's category to our categories
    category_mapping = {
      'income' => 'Income',
      'transfer_in' => 'Transfer',
      'transfer_out' => 'Transfer',
      'loan_payments' => 'Debt Payment',
      'bank_fees' => 'Fees & Charges',
      'entertainment' => 'Entertainment',
      'food_and_drink' => 'Food & Dining',
      'general_merchandise' => 'Shopping',
      'home_improvement' => 'Home',
      'medical' => 'Healthcare',
      'personal_care' => 'Personal Care',
      'general_services' => 'Services',
      'government_and_non_profit' => 'Taxes',
      'transportation' => 'Transportation',
      'travel' => 'Travel',
      'rent_and_utilities' => 'Bills & Utilities'
    }

    category_name = category_mapping[primary]
    return nil unless category_name

    household.categories.find_by("LOWER(name) = ?", category_name.downcase)
  end

  def handle_plaid_error(error)
    error_info = PlaidErrorHandler.handle_error(error)
    Rails.logger.error "Plaid sync error for connection #{connection.id}: #{error_info[:error_message]}"

    if %w[ITEM_LOGIN_REQUIRED INVALID_CREDENTIALS].include?(error_info[:error_code])
      connection.mark_error!(error_info[:error_code], error_info[:error_message])
    end

    failure([error_info[:display_message] || 'Failed to sync transactions'])
  end
end

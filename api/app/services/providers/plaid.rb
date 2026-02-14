# Plaid provider adapter implementing Providers::Base interface

module Providers
  class Plaid < Base
    def create_link_token(user:, webhook_url: nil, products: nil, country_codes: nil, update_mode: false)
      return failure('Plaid is not configured') unless PlaidConfig.enabled?

      request = ::Plaid::LinkTokenCreateRequest.new({
        products: products || default_products,
        client_name: 'OpenFinance',
        country_codes: country_codes || default_country_codes,
        language: 'en',
        user: { client_user_id: user.id.to_s }
      })

      request.webhook = (webhook_url || default_webhook_url) if (webhook_url || default_webhook_url).present?

      if update_mode
        request.account_filters = {
          depository: { account_subtypes: %w[checking savings] },
          credit: { account_subtypes: %w[credit_card] }
        }
      end

      response = PlaidConfig.client.link_token_create(request)
      Rails.logger.info "Created Plaid link token for user #{user.id}"
      success(link_token: response.link_token, expiration: response.expiration)
    rescue ::Plaid::ApiError => e
      handle_plaid_error(e, 'Failed to create link token')
    rescue StandardError => e
      Rails.logger.error "Plaid link token creation failed: #{e.message}"
      failure('Failed to create link token')
    end

    def exchange_token(public_token:, user:, metadata: {})
      return failure('Plaid is not configured') unless PlaidConfig.enabled?

      ActiveRecord::Base.transaction do
        exchange_response = PlaidConfig.client.item_public_token_exchange(
          ::Plaid::ItemPublicTokenExchangeRequest.new(public_token: public_token)
        )
        access_token = exchange_response.access_token
        item_id = exchange_response.item_id

        Rails.logger.info "Exchanged public token for user #{user.id}, item: #{item_id}"

        institution = resolve_institution(metadata['institution']&.dig('institution_id'))

        conn = user.household.account_connections.create!(
          institution: institution,
          provider: 'plaid',
          provider_connection_id: item_id,
          provider_access_token: access_token,
          status: 'active',
          created_by: user,
          last_synced_at: nil,
          consent_expires_at: 90.days.from_now
        )

        accounts_response = PlaidConfig.client.accounts_get(
          ::Plaid::AccountsGetRequest.new(access_token: access_token)
        )
        accounts = accounts_response.accounts.map { |pa| create_account_from_plaid(conn, user, pa) }

        SyncTransactionsJob.safe_perform_later(conn, set_options: { wait: 10.seconds })

        success(connection: conn, accounts: accounts, institution: institution)
      end
    rescue ::Plaid::ApiError => e
      handle_plaid_error(e, 'Failed to connect account')
    rescue StandardError => e
      Rails.logger.error "Public token exchange failed: #{e.message}"
      failure('Failed to connect account')
    end

    def sync_transactions
      return failure('Plaid is not configured') unless PlaidConfig.enabled?
      return failure('Connection is not active') unless connection&.active?

      added_count = 0
      modified_count = 0
      removed_count = 0
      cursor = connection.sync_cursor
      has_more = true

      while has_more
        response = PlaidConfig.client.transactions_sync(
          ::Plaid::TransactionsSyncRequest.new(
            access_token: connection.provider_access_token,
            cursor: cursor.presence,
            count: 500
          )
        )

        added_count += process_added(response.added || [])
        modified_count += process_modified(response.modified || [])
        removed_count += process_removed(response.removed || [])
        cursor = response.next_cursor
        has_more = response.has_more
      end

      connection.update!(last_synced_at: Time.current, sync_cursor: cursor)
      success(added: added_count, modified: modified_count, removed: removed_count)
    rescue ::Plaid::ApiError => e
      error_info = PlaidErrorHandler.handle_error(e)
      if %w[ITEM_LOGIN_REQUIRED INVALID_CREDENTIALS].include?(error_info[:error_code])
        connection.mark_error!(error_info[:error_code], error_info[:error_message])
      end
      handle_plaid_error(e, 'Failed to sync transactions')
    rescue StandardError => e
      Rails.logger.error "Transaction sync failed for connection #{connection.id}: #{e.message}"
      failure("Failed to sync transactions: #{e.message}")
    end

    def get_accounts
      return failure('Plaid is not configured') unless PlaidConfig.enabled?

      response = PlaidConfig.client.accounts_get(
        ::Plaid::AccountsGetRequest.new(access_token: connection.provider_access_token)
      )
      success(accounts: response.accounts)
    rescue ::Plaid::ApiError => e
      handle_plaid_error(e, 'Failed to fetch accounts')
    end

    def get_balances
      return failure('Plaid is not configured') unless PlaidConfig.enabled?

      response = PlaidConfig.client.accounts_get(
        ::Plaid::AccountsGetRequest.new(access_token: connection.provider_access_token)
      )

      balances = response.accounts.each_with_object({}) do |acct, hash|
        hash[acct.account_id] = {
          current: acct.balances&.current,
          available: acct.balances&.available,
          limit: acct.balances&.limit,
          currency: acct.balances&.iso_currency_code || 'USD'
        }
      end
      success(balances: balances)
    rescue ::Plaid::ApiError => e
      handle_plaid_error(e, 'Failed to fetch balances')
    end

    def get_institution(institution_id:)
      return failure('Plaid is not configured') unless PlaidConfig.enabled?

      response = PlaidConfig.client.institutions_get_by_id(
        ::Plaid::InstitutionsGetByIdRequest.new(
          institution_id: institution_id,
          country_codes: %w[US CA]
        )
      )
      success(institution: response.institution)
    rescue ::Plaid::ApiError => e
      handle_plaid_error(e, 'Failed to fetch institution')
    end

    private

    def handle_plaid_error(error, default_message)
      error_info = PlaidErrorHandler.handle_error(error)
      Rails.logger.error "Plaid API error: #{error_info[:error_message]}"
      failure(error_info[:display_message] || default_message)
    end

    def default_webhook_url
      return nil unless Rails.env.production?
      ENV['PLAID_WEBHOOK_URL']
    end

    def default_products = %w[transactions auth]
    def default_country_codes = %w[US CA]

    def resolve_institution(institution_id)
      return nil unless institution_id
      Institution.find_by(plaid_institution_id: institution_id) ||
        fetch_institution_from_plaid(institution_id)
    end

    def fetch_institution_from_plaid(institution_id)
      response = PlaidConfig.client.institutions_get_by_id(
        ::Plaid::InstitutionsGetByIdRequest.new(institution_id: institution_id, country_codes: %w[US CA])
      )
      Institution.find_or_create_from_plaid(response.institution)
    rescue ::Plaid::ApiError => e
      Rails.logger.warn "Failed to fetch institution #{institution_id}: #{e.message}"
      nil
    end

    def create_account_from_plaid(conn, user, plaid_account)
      balance_current = plaid_account.balances&.current || 0
      balance_available = plaid_account.balances&.available
      currency = plaid_account.balances&.iso_currency_code || 'USD'
      account_type = map_plaid_account_type(plaid_account.type)
      subtype = map_plaid_account_subtype(plaid_account.subtype)

      if %w[checking savings].include?(subtype)
        account_type = subtype
        subtype = nil
      elsif subtype == 'credit_card'
        subtype = nil
      end

      conn.accounts.create!(
        household: user.household,
        name: plaid_account.name,
        official_name: plaid_account.official_name,
        account_type: account_type,
        account_subtype: subtype.nil? || subtype == 'other' ? nil : subtype,
        plaid_account_id: plaid_account.account_id,
        mask: plaid_account.mask,
        current_balance_cents: (balance_current * 100).round,
        available_balance_cents: balance_available ? (balance_available * 100).round : nil,
        currency: currency,
        is_manual: false
      )
    end

    def process_added(transactions)
      count = 0
      transactions.each do |txn|
        account = connection.accounts.find_by(plaid_account_id: txn.account_id)
        next unless account
        Transaction.find_or_create_by!(plaid_transaction_id: txn.transaction_id) do |t|
          t.account = account
          t.household = connection.household
          t.date = txn.date
          t.amount_cents = (-(txn.amount || 0) * 100).round
          t.currency = txn.iso_currency_code || 'USD'
          t.name = txn.name
          t.merchant_name = txn.merchant_name
          t.is_pending = txn.pending || false
          t.category = map_category(txn.personal_finance_category)
          t.metadata = { plaid_category: txn.personal_finance_category&.to_hash }
        end
        count += 1
      end
      count
    end

    def process_modified(transactions)
      count = 0
      transactions.each do |txn|
        record = Transaction.find_by(plaid_transaction_id: txn.transaction_id)
        next unless record
        record.update!(
          amount_cents: (-(txn.amount || 0) * 100).round,
          name: txn.name, merchant_name: txn.merchant_name,
          is_pending: txn.pending || false, date: txn.date
        )
        count += 1
      end
      count
    end

    def process_removed(transactions)
      Transaction.where(plaid_transaction_id: transactions.map(&:transaction_id)).delete_all
    end

    def map_category(personal_finance_category)
      return nil unless personal_finance_category
      primary = personal_finance_category['primary']&.downcase
      mapping = {
        'income' => 'Income', 'transfer_in' => 'Transfer', 'transfer_out' => 'Transfer',
        'loan_payments' => 'Debt Payment', 'bank_fees' => 'Fees & Charges',
        'entertainment' => 'Entertainment', 'food_and_drink' => 'Food & Dining',
        'general_merchandise' => 'Shopping', 'home_improvement' => 'Home',
        'medical' => 'Healthcare', 'personal_care' => 'Personal Care',
        'general_services' => 'Services', 'government_and_non_profit' => 'Taxes',
        'transportation' => 'Transportation', 'travel' => 'Travel',
        'rent_and_utilities' => 'Bills & Utilities'
      }
      name = mapping[primary]
      return nil unless name
      connection.household.categories.find_by("LOWER(name) = ?", name.downcase)
    end

    def map_plaid_account_type(t)
      { 'depository' => 'checking', 'credit' => 'credit_card', 'loan' => 'loan', 'investment' => 'investment' }[t] || 'other_asset'
    end

    def map_plaid_account_subtype(s)
      { 'checking' => 'checking', 'savings' => 'savings', 'money market' => 'money_market', 'cd' => 'cd',
        'credit card' => 'credit_card', '401k' => '401k', 'ira' => 'ira', 'roth' => 'roth_ira' }[s] || 'other'
    end
  end
end

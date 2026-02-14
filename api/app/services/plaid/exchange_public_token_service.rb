# Service for exchanging Plaid public tokens for access tokens
# Creates account connections and sets up initial account sync

class Plaid::ExchangePublicTokenService < ApplicationService
  attr_accessor :public_token, :user, :metadata

  validates :public_token, presence: true
  validates :user, presence: true

  def call
    return validation_failure(self) unless valid?
    return failure(['Plaid is not configured']) unless PlaidConfig.enabled?

    ActiveRecord::Base.transaction do
      exchange_token!
      fetch_institution!
      create_connection!
      fetch_accounts!
      schedule_initial_sync!
    end

    success(
      connection: @connection,
      accounts: @accounts,
      institution: @institution
    )
  rescue Plaid::ApiError => e
    handle_plaid_error(e)
  rescue StandardError => e
    Rails.logger.error "Public token exchange failed: #{e.message}"
    failure(['Failed to connect account'])
  end

  private

  def initialize(public_token:, user:, metadata: {})
    @public_token = public_token
    @user = user
    @metadata = metadata || {}
  end

  def exchange_token!
    request = Plaid::ItemPublicTokenExchangeRequest.new({
      public_token: public_token
    })

    response = PlaidConfig.client.item_public_token_exchange(request)
    
    @access_token = response.access_token
    @item_id = response.item_id
    @request_id = response.request_id

    Rails.logger.info "Exchanged public token for user #{user.id}, item: #{@item_id}"
  end

  def fetch_institution!
    # Get institution info from metadata or fetch from Plaid
    institution_id = metadata['institution']&.dig('institution_id')
    
    if institution_id
      @institution = find_or_create_institution(institution_id)
    else
      @institution = nil
    end
  end

  def create_connection!
    @connection = user.household.account_connections.create!(
      institution: @institution,
      provider: 'plaid',
      provider_connection_id: @item_id,
      provider_access_token: @access_token,
      status: 'active',
      created_by: user,
      last_synced_at: nil,
      consent_expires_at: 90.days.from_now # Plaid tokens typically last 90 days
    )
  end

  def fetch_accounts!
    request = Plaid::AccountsGetRequest.new({
      access_token: @access_token
    })

    response = PlaidConfig.client.accounts_get(request)
    
    @accounts = response.accounts.map do |plaid_account|
      create_account_from_plaid(plaid_account)
    end
  end

  def create_account_from_plaid(plaid_account)
    balance_current = plaid_account.balances&.current || 0
    balance_available = plaid_account.balances&.available
    currency = plaid_account.balances&.iso_currency_code || 'USD'

    account_type = map_plaid_account_type(plaid_account.type)
    subtype = map_plaid_account_subtype(plaid_account.subtype)
    # Refine account_type based on subtype
    account_type = subtype if %w[checking savings].include?(subtype) && account_type == 'checking'

    @connection.accounts.create!(
      household: user.household,
      name: plaid_account.name,
      official_name: plaid_account.official_name,
      account_type: account_type,
      account_subtype: subtype == 'other' ? nil : subtype,
      plaid_account_id: plaid_account.account_id,
      mask: plaid_account.mask,
      current_balance_cents: (balance_current * 100).round,
      available_balance_cents: balance_available ? (balance_available * 100).round : nil,
      currency: currency,
      is_manual: false
    )
  end

  def schedule_initial_sync!
    # Schedule an immediate sync of transactions
    # Gracefully handle Sidekiq being unavailable
    SyncTransactionsJob.safe_perform_later(@connection, set_options: { wait: 10.seconds })
  rescue StandardError => e
    Rails.logger.warn "Failed to schedule initial sync: #{e.message}"
  end

  def find_or_create_institution(institution_id)
    Institution.find_by(plaid_institution_id: institution_id) ||
      fetch_institution_from_plaid(institution_id)
  end

  def fetch_institution_from_plaid(institution_id)
    request = Plaid::InstitutionsGetByIdRequest.new({
      institution_id: institution_id,
      country_codes: %w[US CA]
    })

    response = PlaidConfig.client.institutions_get_by_id(request)
    institution_data = response.institution

    Institution.find_or_create_from_plaid(institution_data)
  rescue Plaid::ApiError => e
    Rails.logger.warn "Failed to fetch institution #{institution_id}: #{e.message}"
    nil
  end

  def map_plaid_account_type(plaid_type)
    case plaid_type
    when 'depository'
      'checking' # Default, will be refined by subtype
    when 'credit'
      'credit_card'
    when 'loan'
      'loan'
    when 'investment'
      'investment'
    else
      'other_asset'
    end
  end

  def map_plaid_account_subtype(plaid_subtype)
    case plaid_subtype
    when 'checking'
      'checking'
    when 'savings'
      'savings'
    when 'money market'
      'money_market'
    when 'cd'
      'cd'
    when 'credit card'
      'credit_card'
    when '401k'
      '401k'
    when 'ira'
      'ira'
    when 'roth'
      'roth_ira'
    else
      'other'
    end
  end

  def handle_plaid_error(error)
    error_info = PlaidErrorHandler.handle_error(error)
    
    Rails.logger.error "Plaid API error: #{error_info[:error_message]}"
    
    failure([error_info[:display_message] || 'Failed to connect account'])
  end
end
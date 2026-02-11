# Plaid configuration for OpenFinance
# Handles bank account connectivity and data aggregation

# Skip Plaid configuration if not enabled or missing credentials
if ENV['ENABLE_PLAID'] != 'true' || ENV['PLAID_CLIENT_ID'].blank? || ENV['PLAID_SECRET'].blank?
  Rails.logger.info "Plaid integration disabled or missing credentials"
else
  begin
    # Determine Plaid environment
    plaid_env = ENV.fetch('PLAID_ENVIRONMENT', 'sandbox').downcase

    # Configure Plaid client
    configuration = Plaid::Configuration.new
    configuration.server_index = Plaid::Configuration::Environment[plaid_env]
    configuration.api_key = {
      'PLAID-CLIENT-ID' => ENV['PLAID_CLIENT_ID'],
      'PLAID-SECRET' => ENV['PLAID_SECRET'],
      'Plaid-Version' => '2020-09-14'
    }

    api_client = Plaid::ApiClient.new(configuration)
    
    # Initialize Plaid APIs
    PLAID_CLIENT = Plaid::PlaidApi.new(api_client)
    
    Rails.logger.info "Plaid initialized successfully in #{plaid_env} environment"
    
    Rails.logger.info "Plaid client configured (connection will be tested on first use)"
    
  rescue => e
    Rails.logger.error "Failed to initialize Plaid: #{e.message}"
    if Rails.env.production?
      raise "Plaid initialization failed in production: #{e.message}"
    else
      Rails.logger.warn "Plaid unavailable in #{Rails.env} environment"
    end
  end
end

# Plaid configuration constants
module PlaidConfig
  ENVIRONMENT = ENV.fetch('PLAID_ENVIRONMENT', 'sandbox').to_sym
  CLIENT_ID = ENV['PLAID_CLIENT_ID']
  SECRET = ENV['PLAID_SECRET']
  WEBHOOK_URL = ENV['PLAID_WEBHOOK_URL']
  
  # Supported Plaid products
  PRODUCTS = %w[
    transactions
    auth
    identity
    assets
    investments
    liabilities
  ].freeze
  
  # Supported account types
  ACCOUNT_TYPES = %w[
    depository
    credit
    loan
    investment
    other
  ].freeze
  
  # Supported account subtypes
  ACCOUNT_SUBTYPES = {
    depository: %w[checking savings hsa cd money_market paypal],
    credit: %w[credit_card paypal],
    loan: %w[auto business commercial construction consumer home_equity
             line_of_credit mortgage overdraft student],
    investment: %w[401k 403B 457b 529 brokerage cash_isa education_savings_account
                   ebt gic health_reimbursement_arrangement ira isa keogh
                   lif lira lrif lrsp non_custodial_wallet non_taxable_brokerage_account
                   other_annuity other_insurance pension plan profit_sharing_plan
                   rdsp resp retirement rlif rrif rrsp sarsep sep_ira simple_ira
                   sipp stock_plan taxable_brokerage_account tfsa trust ugma utma
                   variable_annuity]
  }.freeze
  
  def self.enabled?
    ENV['ENABLE_PLAID'] == 'true' && CLIENT_ID.present? && SECRET.present?
  end
  
  def self.client
    defined?(PLAID_CLIENT) ? PLAID_CLIENT : nil
  end
end

# Plaid error handling
module PlaidErrorHandler
  def self.parse_error_body(error)
    body = error.response_body
    body.is_a?(String) ? JSON.parse(body) : (body || {})
  rescue JSON::ParserError
    {}
  end

  def self.handle_error(error)
    case error
    when Plaid::ApiError
      body = parse_error_body(error)
      {
        error_type: body['error_type'],
        error_code: body['error_code'],
        error_message: body['error_message'] || error.message,
        display_message: body['display_message']
      }
    else
      {
        error_type: 'UNKNOWN_ERROR',
        error_code: 'UNKNOWN',
        error_message: error.message,
        display_message: 'An unexpected error occurred'
      }
    end
  end
  
  def self.retryable_error?(error)
    return false unless error.is_a?(Plaid::ApiError)
    
    body = parse_error_body(error)
    retryable_codes = %w[
      INSTITUTION_DOWN
      INSTITUTION_NOT_RESPONDING
      INTERNAL_SERVER_ERROR
      PLANNED_MAINTENANCE
    ]
    
    retryable_codes.include?(body['error_code'])
  end
end
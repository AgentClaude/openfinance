# Service for creating Plaid Link tokens
# Generates secure tokens for account connection flow

class Plaid::CreateLinkTokenService < ApplicationService
  attr_accessor :user, :webhook_url, :products, :country_codes, :update_mode

  validates :user, presence: true

  def call
    return validation_failure(self) unless valid?
    return failure(['Plaid is not configured']) unless PlaidConfig.enabled?

    begin
      create_link_token!
      success(link_token: @link_token, expiration: @expiration)
    rescue Plaid::ApiError => e
      handle_plaid_error(e)
    rescue StandardError => e
      Rails.logger.error "Plaid link token creation failed: #{e.message}"
      failure(['Failed to create link token'])
    end
  end

  private

  def initialize(user:, webhook_url: nil, products: nil, country_codes: nil, update_mode: false)
    @user = user
    @webhook_url = webhook_url || default_webhook_url
    @products = products || default_products
    @country_codes = country_codes || default_country_codes
    @update_mode = update_mode
  end

  def create_link_token!
    request = build_link_token_request

    response = PlaidConfig.client.link_token_create(request)
    
    @link_token = response.link_token
    @expiration = response.expiration

    Rails.logger.info "Created Plaid link token for user #{user.id}"
  end

  def build_link_token_request
    request = Plaid::LinkTokenCreateRequest.new({
      products: @products,
      client_name: 'OpenFinance',
      country_codes: @country_codes,
      language: 'en',
      user: {
        client_user_id: user.id.to_s
      }
    })

    # Add webhook URL if provided
    if @webhook_url.present?
      request.webhook = @webhook_url
    end

    # Add account filters for updates
    if @update_mode
      request.account_filters = {
        depository: {
          account_subtypes: %w[checking savings]
        },
        credit: {
          account_subtypes: %w[credit_card]
        }
      }
    end

    request
  end

  def handle_plaid_error(error)
    error_info = PlaidErrorHandler.handle_error(error)
    
    Rails.logger.error "Plaid API error: #{error_info[:error_message]}"
    
    failure([error_info[:display_message] || 'Failed to create link token'])
  end

  def default_webhook_url
    return nil unless Rails.env.production?
    
    ENV['PLAID_WEBHOOK_URL']
  end

  def default_products
    %w[transactions auth]
  end

  def default_country_codes
    %w[US CA]
  end
end
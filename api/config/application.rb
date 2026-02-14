require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module OpenFinance
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.

    # Set timezone
    config.time_zone = 'UTC'

    # API-only mode
    config.api_only = true

    # CORS Configuration — handled by config/initializers/cors.rb
    # config.middleware.insert_before 0, Rack::Cors do
    #   allow do
    #     origins ENV['CORS_ORIGINS']&.split(',') || ['http://localhost:3000']
    #     resource '*',
    #       headers: :any,
    #       methods: [:get, :post, :put, :patch, :delete, :options, :head],
    #       credentials: true
    #   end
    # end

    # JWT Configuration
    config.jwt_secret_key = ENV.fetch('JWT_SECRET_KEY', 'dev-jwt-secret-change-me')

    # Redis Configuration
    config.redis_url = ENV['REDIS_URL'] || 'redis://localhost:6379/0'

    # Job Queue
    config.active_job.queue_adapter = :sidekiq

    # Generator Configuration
    config.generators do |g|
      g.test_framework :rspec,
        fixtures: false,
        view_specs: false,
        helper_specs: false,
        routing_specs: false,
        controller_specs: false,
        request_specs: true
      g.fixture_replacement :factory_bot, dir: 'spec/factories'
    end

    # Use UUIDs for primary keys
    config.generators.orm :active_record, primary_key_type: :uuid

    # Session configuration
    config.session_store :disabled

    # Security headers
    config.force_ssl = Rails.env.production?

    # Logging
    config.log_level = :info
    config.log_tags = [:request_id]

    # Money Configuration
    config.before_initialize do
      Money.locale_backend = :currency
      Money.rounding_mode = BigDecimal::ROUND_HALF_UP
    end

    # Rails 8 auto-discovers app/ subdirectories; autoload_lib handles lib/
    # No need to manually add autoload_paths

    # Plaid Configuration
    config.plaid_environment = ENV['PLAID_ENVIRONMENT'] || 'sandbox'
    config.plaid_client_id = ENV['PLAID_CLIENT_ID']
    config.plaid_secret = ENV['PLAID_SECRET']

    # Custom error handling for API
    # config.exceptions_app = routes
  end
end
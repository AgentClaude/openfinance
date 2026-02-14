require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory usage.
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Turn on fragment caching in view templates.
  config.action_controller.perform_caching = true

  # Cache assets for far-future expiry.
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=#{1.year.to_i}",
    "Expires" => 1.year.from_now.to_fs(:rfc822)
  }

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.variant_processor = :mini_magick

  # Force all access to the app over SSL, use Strict-Transport-Security,
  # and use secure cookies.
  config.force_ssl = ENV.fetch("FORCE_SSL", "true") == "true"

  # Skip DNS rebinding protection for the default health check endpoint.
  # config.host_authorization = { exclude: ->(request) { request.path == "/up" } }

  # Log to STDOUT by default
  config.logger = ActiveSupport::Logger.new($stdout)
    .tap  { |logger| logger.formatter = ::Logger::Formatter.new }
    .then { |logger| ActiveSupport::TaggedLogging.new(logger) }

  # Change to "debug" to log everything (including potentially personally-identifiable information!)
  config.log_level = ENV.fetch("LOG_LEVEL", "info")

  # Disable logging of parameters in production for security
  config.filter_parameters += [
    :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn
  ]

  # Use a different cache store in production.
  config.cache_store = :redis_cache_store, {
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1'),
    reconnect_attempts: 1,
    pool: false,
    error_handler: -> (method:, returning:, exception:) {
      Rails.logger.error "Redis cache error: #{exception.message}"
    }

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Enable DNS rebinding protection and other `Host` header attacks.
  config.hosts = ENV.fetch("ALLOWED_HOSTS", "").split(",").map(&:strip).reject(&:blank?)
  config.host_authorization = {
    exclude: ->(request) { 
      request.path.start_with?("/health", "/up") || 
      request.get_header("HTTP_USER_AGENT")&.include?("Docker")
    }
  }

  # Action Mailer
  config.action_mailer.perform_caching = false
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default_url_options = { 
    host: ENV.fetch("MAILER_HOST", "localhost:3001"),
    protocol: ENV.fetch("MAILER_PROTOCOL", "https")
  }

  # SMTP configuration
  if ENV['SMTP_ADDRESS'].present?
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: ENV['SMTP_ADDRESS'],
      port: ENV.fetch('SMTP_PORT', 587).to_i,
      user_name: ENV['SMTP_USERNAME'],
      password: ENV['SMTP_PASSWORD'],
      authentication: ENV.fetch('SMTP_AUTHENTICATION', 'plain'),
      enable_starttls_auto: ENV.fetch('SMTP_ENABLE_STARTTLS', 'true') == 'true',
      domain: ENV['SMTP_DOMAIN']
    }
  end

  # Active Job
  config.active_job.queue_adapter = :sidekiq

  # Redis configuration for sessions and caching
  config.redis = {
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'),
    timeout: 1
  }

  # Database query timeout
  config.active_record.query_timeout = 30.seconds

  # Instrumentation
  if ENV['NEW_RELIC_LICENSE_KEY'].present?
    require 'newrelic_rpm'
  end

  # Error tracking with Sentry
  if ENV['SENTRY_DSN'].present?
    require 'sentry-rails'
    config.sentry = {
      dsn: ENV['SENTRY_DSN'],
      breadcrumbs_logger: [:active_support_logger, :http_logger]
    }
  end

  # Rate limiting
  config.rate_limit_requests_per_minute = ENV.fetch('RATE_LIMIT_REQUESTS_PER_MINUTE', 100).to_i
end
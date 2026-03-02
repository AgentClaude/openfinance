# Sidekiq configuration for OpenFinance background jobs

require 'sidekiq'
require 'sidekiq/web'
require 'sidekiq-cron'

# Sidekiq Web UI authentication (production)
if Rails.env.production?
  Sidekiq::Web.use(Rack::Auth::Basic) do |user, password|
    # Use environment variables for Sidekiq web auth
    user == ENV.fetch('SIDEKIQ_WEB_USERNAME', 'admin') &&
    password == ENV.fetch('SIDEKIQ_WEB_PASSWORD', 'change_me_in_production')
  end
end

# Sidekiq configuration
Sidekiq.configure_server do |config|
  # Redis connection for server
  config.redis = {
    url: ENV.fetch('SIDEKIQ_REDIS_URL', ENV.fetch('REDIS_URL', 'redis://localhost:6379/1')),
    network_timeout: 5,
    pool_timeout: 5
  }
  
  # Server-specific settings
  config.concurrency = ENV.fetch('SIDEKIQ_CONCURRENCY', 5).to_i
  
  # Death handlers for failed jobs
  config.death_handlers << lambda do |job, ex|
    Rails.logger.error "Sidekiq job died: #{job.inspect}"
    Rails.logger.error "Exception: #{ex.message}"
    Rails.logger.error ex.backtrace.join("\n") if ex.backtrace
    
    # Send to error tracking service if available
    if defined?(Sentry)
      Sentry.capture_exception(ex, contexts: { job: job })
    end
  end
  
end

Sidekiq.configure_client do |config|
  # Redis connection for client
  config.redis = {
    url: ENV.fetch('SIDEKIQ_REDIS_URL', ENV.fetch('REDIS_URL', 'redis://localhost:6379/1')),
    network_timeout: 5,
    pool_timeout: 5
  }
end

# Custom Sidekiq middleware for context
class SidekiqContextMiddleware
  def call(worker, job, queue)
    # Add request ID for job tracking
    job['request_id'] ||= SecureRandom.uuid
    
    # Log job start
    Rails.logger.info "Starting Sidekiq job: #{worker.class.name} (#{job['jid']})"
    
    start_time = Time.current
    
    begin
      yield
      duration = Time.current - start_time
      Rails.logger.info "Completed Sidekiq job: #{worker.class.name} in #{duration.round(3)}s"
    rescue => e
      duration = Time.current - start_time
      Rails.logger.error "Failed Sidekiq job: #{worker.class.name} after #{duration.round(3)}s - #{e.message}"
      raise
    end
  end
end

# Add custom middleware
Sidekiq.configure_server do |config|
  config.server_middleware do |chain|
    chain.add SidekiqContextMiddleware
  end
end

# Queue priorities and configurations
Sidekiq.configure_server do |config|
  config.queues = %w[critical high default low]
end

# Custom error handler for better error tracking
class SidekiqErrorHandler
  def call(ex, ctx_hash)
    Rails.logger.error "Sidekiq Error: #{ex.message}"
    Rails.logger.error ctx_hash.inspect
    
    # Send to external error service if configured
    if defined?(Sentry) && ENV['SENTRY_DSN'].present?
      Sentry.capture_exception(ex, contexts: ctx_hash)
    end
    
    # Could also send to Slack, email, etc.
  end
end

Sidekiq.configure_server do |config|
  config.error_handlers << SidekiqErrorHandler.new
end

# Health check for Sidekiq
Rails.application.config.after_initialize do
  if defined?(Sidekiq) && Rails.env.production?
    begin
      Sidekiq.redis_info
      Rails.logger.info "Sidekiq Redis connection successful"
    rescue => e
      Rails.logger.error "Sidekiq Redis connection failed: #{e.message}"
    end
  end
end
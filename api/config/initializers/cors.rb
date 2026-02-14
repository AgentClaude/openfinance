# CORS configuration for OpenFinance API
# Allows the React frontend to communicate with the Rails API

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Development configuration
  if Rails.env.development?
    allow do
      origins 'localhost:3000', '127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:3000',
              'localhost:3002', '127.0.0.1:3002', 'http://localhost:3002', 'http://127.0.0.1:3002',
              'localhost:5173', '127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5173',
              /\Ahttp:\/\/100\.\d+\.\d+\.\d+:\d+\z/
      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: true,
        expose: ['Authorization']
    end
  end
  
  # Production configuration
  if Rails.env.production?
    # Parse allowed origins from environment
    allowed_origins = ENV.fetch('CORS_ORIGINS', '').split(',').map(&:strip).reject(&:blank?)
    
    # Add default origins if none specified
    if allowed_origins.empty?
      Rails.logger.warn "No CORS_ORIGINS specified, using localhost defaults"
      allowed_origins = ['http://localhost:3000']
    end
    
    allow do
      origins allowed_origins
      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: true,
        expose: ['Authorization'],
        max_age: 86400 # 24 hours
    end
  end
  
  # Test configuration
  if Rails.env.test?
    allow do
      origins '*'
      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: false
    end
  end
end

# Log CORS configuration on startup
Rails.application.config.after_initialize do
  if defined?(Rack::Cors)
    origins = Rails.env.development? ? ['localhost:3000'] : ENV.fetch('CORS_ORIGINS', '').split(',')
    Rails.logger.info "CORS configured for origins: #{origins.join(', ')}"
  end
end
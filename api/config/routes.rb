Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'health#show'
  get '/up', to: 'health#show' # Rails 8 standard health check

  # GraphQL endpoint
  post '/graphql', to: 'graphql#execute'

  # GraphQL introspection and playground (development only)
  if Rails.env.development? || Rails.env.test?
    get '/graphiql', to: 'graphql#playground'
  end

  # Devise routes with API-friendly controllers
  devise_for :users,
    controllers: {
      sessions: 'api/sessions',
      registrations: 'api/registrations',
      passwords: 'api/passwords'
    },
    skip: [:sessions, :registrations, :passwords]

  # Custom API authentication routes
  namespace :api do
    # Authentication
    post '/auth/login', to: 'sessions#create'
    delete '/auth/logout', to: 'sessions#destroy'
    post '/auth/refresh', to: 'sessions#refresh'
    
    # User registration
    post '/auth/register', to: 'registrations#create'
    
    # Password management
    post '/auth/forgot-password', to: 'passwords#create'
    patch '/auth/reset-password', to: 'passwords#update'
    
    # User profile
    get '/me', to: 'users#show'
    patch '/me', to: 'users#update'
    
    # Two-factor authentication
    post '/auth/2fa/enable', to: 'two_factor#enable'
    post '/auth/2fa/verify', to: 'two_factor#verify'
    delete '/auth/2fa/disable', to: 'two_factor#disable'
  end

  # Webhooks (no authentication required)
  namespace :webhooks do
    post '/plaid', to: 'plaid#create'
  end

  # Catch all unmatched routes
  match '*path', to: proc { [404, { 'Content-Type' => 'application/json' }, ['{"error":"Not Found"}']] }, via: :all
end
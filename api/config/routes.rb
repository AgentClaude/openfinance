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

  # Public API v1
  namespace :api do
    namespace :v1 do
      # API docs (no auth required)
      get '/docs', to: 'api_docs#show'

      # Authenticated endpoints
      get '/accounts', to: 'accounts#index'
      get '/transactions', to: 'transactions#index'
      get '/budgets/:month', to: 'budgets#show'
      get '/net_worth', to: 'net_worth#show'
      get '/monthly_summary/:month', to: 'monthly_summary#show'
      get '/daily_spend/:date', to: 'daily_spend#show'
      get '/account_balances', to: 'account_balances#index'

      # Webhook subscriptions
      resources :webhooks, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :test
          get :events
        end
      end

      # Embeddable widget endpoints (share token auth, no API key)
      # Supports both JSON (default) and HTML (.html suffix) for iframe embedding
      get '/embed/net_worth', to: 'embed#net_worth'
      get '/embed/spending', to: 'embed#spending'
      get '/embed/budget', to: 'embed#budget'
    end
  end

  # Webhooks (no authentication required)
  namespace :webhooks do
    post '/plaid', to: 'plaid#create'
  end

  # Catch all unmatched routes
  match '*path', to: proc { [404, { 'Content-Type' => 'application/json' }, ['{"error":"Not Found"}']] }, via: :all
end
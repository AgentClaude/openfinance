FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { 'password123' }
    password_confirmation { 'password123' }
    name { Faker::Name.name }
    role { 'owner' }
    confirmed_at { Time.current }
    jti { SecureRandom.uuid }
    
    association :household

    trait :member do
      role { 'member' }
    end

    trait :advisor do
      role { 'advisor' }
    end

    trait :with_two_factor do
      two_factor_enabled { true }
      two_factor_secret { ROTP::Base32.random }
    end
  end

  factory :household do
    name { "#{Faker::Name.last_name} Household" }
    currency { 'USD' }
    timezone { 'America/New_York' }
    is_active { true }
  end

  factory :account do
    association :household
    
    name { Faker::Bank.name + " " + %w[Checking Savings Credit].sample }
    account_type { 'checking' }
    account_subtype { nil }
    current_balance_cents { rand(100000..1000000) }
    available_balance_cents { current_balance_cents }
    currency { 'USD' }
    is_manual { true }
    is_hidden { false }
    display_order { 1 }

    trait :savings do
      account_subtype { 'savings' }
    end

    trait :credit do
      account_type { 'credit_card' }
      account_subtype { nil }
      current_balance_cents { -rand(10000..100000) }
      credit_limit_cents { 500000 }
      available_balance_cents { credit_limit_cents + current_balance_cents }
    end
  end

  factory :category do
    association :household
    
    name { Faker::Commerce.department }
    is_income { false }
    is_system { false }
    is_active { true }
    color_hex { '#' + '%06x' % (rand * 0xffffff) }
    display_order { 1 }

    trait :income do
      is_income { true }
    end

    trait :system do
      is_system { true }
    end
  end

  factory :institution do
    name { Faker::Bank.name }
    plaid_institution_id { "ins_#{rand(100000)}" }
    primary_color { '#1f77b4' }
  end

  factory :account_connection do
    association :household
    association :created_by, factory: :user
    provider { 'plaid' }
    status { 'active' }
    provider_connection_id { "item_#{SecureRandom.hex(16)}" }
    provider_access_token { "access-sandbox-#{SecureRandom.hex(16)}" }
    association :institution

    trait :manual do
      provider { 'manual' }
      provider_connection_id { nil }
      provider_access_token { nil }
      institution { nil }
    end

    trait :error do
      status { 'error' }
      error_code { 'ITEM_LOGIN_REQUIRED' }
      error_message { 'Please reconnect your account' }
    end

    trait :disconnected do
      status { 'disconnected' }
    end
  end

  factory :transaction do
    association :account
    association :category
    association :household

    date { rand(30.days).seconds.ago.to_date }
    amount_cents { rand(-50000..-1000) } # Expenses by default
    currency { 'USD' }
    name { Faker::Company.name }
    merchant_name { Faker::Company.name }
    is_pending { false }
    needs_review { false }
    is_recurring { false }

    trait :income do
      amount_cents { rand(100000..500000) }
      category { association :category, :income }
    end

    trait :pending do
      is_pending { true }
    end

    trait :needs_review do
      needs_review { true }
    end
  end
end
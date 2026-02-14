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

  factory :recurring_item do
    association :household

    name { Faker::Company.name }
    merchant_name { name }
    item_type { 'expense' }
    amount_cents { rand(500..20000) }
    currency { 'USD' }
    frequency { 'monthly' }
    frequency_interval { 1 }
    start_date { 3.months.ago.to_date }
    next_occurrence { 1.week.from_now.to_date }
    is_active { true }
    is_income { false }
    is_auto_detected { false }
    occurrence_count { 3 }

    trait :income do
      item_type { 'income' }
      is_income { true }
      amount_cents { rand(200000..500000) }
    end

    trait :overdue do
      next_occurrence { 3.days.ago.to_date }
    end

    trait :due_soon do
      next_occurrence { 3.days.from_now.to_date }
    end

    trait :inactive do
      is_active { false }
    end

    trait :auto_detected do
      is_auto_detected { true }
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

  factory :invitation do
    association :household
    association :invited_by, factory: :user

    email { Faker::Internet.unique.email }
    role { 'member' }
    status { 'pending' }
    token { SecureRandom.urlsafe_base64(32) }
    expires_at { 7.days.from_now }

    trait :accepted do
      status { 'accepted' }
      accepted_at { Time.current }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :advisor do
      role { 'advisor' }
    end
  end

  factory :security do
    symbol { Faker::Finance.ticker }
    name { Faker::Company.name }
    security_type { 'stock' }
    currency { 'USD' }

    trait :etf do
      security_type { 'etf' }
    end

    trait :bond do
      security_type { 'bond' }
    end
  end

  factory :holding do
    association :account
    association :security

    quantity { rand(1.0..100.0).round(4) }
    current_price_cents { rand(1000..50000) }
    cost_basis_cents { rand(1000..50000) }
    currency { 'USD' }
    as_of_date { Date.current }
  end
end

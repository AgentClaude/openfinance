FactoryBot.define do
  factory :plan do
    name { 'Pro' }
    slug { 'pro' }
    price_cents { 999 }
    annual_price_cents { 9990 }
    currency { 'USD' }
    max_accounts { 0 }
    max_transactions { 0 }
    has_reports { true }
    has_budgets { true }
    has_goals { true }
    has_investments { true }
    has_recurring { true }
    has_csv_import { true }
    has_api_access { false }
    has_collaboration { false }
    has_priority_support { false }
    position { 1 }
    is_active { true }

    trait :free do
      name { 'Free' }
      slug { 'free' }
      price_cents { 0 }
      annual_price_cents { 0 }
      max_accounts { 2 }
      max_transactions { 500 }
      has_reports { false }
      has_budgets { true }
      has_goals { false }
      has_investments { false }
      has_recurring { false }
      has_csv_import { false }
      position { 0 }
    end

    trait :team do
      name { 'Team' }
      slug { 'team' }
      price_cents { 1999 }
      annual_price_cents { 19990 }
      has_api_access { true }
      has_collaboration { true }
      has_priority_support { true }
      position { 2 }
    end

    trait :inactive do
      is_active { false }
    end
  end
end

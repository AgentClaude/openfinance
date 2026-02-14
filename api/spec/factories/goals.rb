FactoryBot.define do
  factory :goal do
    association :household

    name { Faker::Lorem.words(number: 3).join(' ').titleize }
    description { Faker::Lorem.sentence }
    goal_type { 'savings' }
    target_amount_cents { rand(100000..1000000) }
    current_amount_cents { rand(0..target_amount_cents) }
    currency { 'USD' }
    target_date { rand(30..365).days.from_now.to_date }
    start_date { Date.current }
    is_active { true }
    is_achieved { false }
    icon { '🎯' }
    color { '#4ECDC4' }

    trait :achieved do
      is_achieved { true }
      achieved_at { Time.current }
      current_amount_cents { target_amount_cents }
    end

    trait :debt_payoff do
      goal_type { 'debt_payoff' }
    end

    trait :inactive do
      is_active { false }
    end
  end

  factory :goal_account do
    association :goal
    association :account
  end
end

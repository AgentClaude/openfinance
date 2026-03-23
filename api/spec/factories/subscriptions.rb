FactoryBot.define do
  factory :subscription do
    association :household
    association :plan

    status { 'active' }
    billing_interval { 'monthly' }
    current_period_start { 30.days.ago }
    current_period_end { 30.days.from_now }

    trait :trialing do
      status { 'trialing' }
      trial_ends_at { 14.days.from_now }
    end

    trait :past_due do
      status { 'past_due' }
    end

    trait :canceled do
      status { 'canceled' }
      canceled_at { Time.current }
    end

    trait :will_cancel do
      cancel_at_period_end { true }
      cancel_at { 30.days.from_now }
    end

    trait :with_stripe do
      stripe_customer_id { "cus_#{SecureRandom.hex(8)}" }
      stripe_subscription_id { "sub_#{SecureRandom.hex(8)}" }
    end

    trait :annual do
      billing_interval { 'annual' }
    end
  end
end

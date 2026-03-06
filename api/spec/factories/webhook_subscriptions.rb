FactoryBot.define do
  factory :webhook_subscription do
    association :user
    url { "https://example.com/webhooks/#{SecureRandom.hex(8)}" }
    events { ['transaction.created'] }
    is_active { true }
    failure_count { 0 }

    trait :inactive do
      is_active { false }
    end

    trait :failing do
      failure_count { 8 }
      last_failed_at { 1.hour.ago }
      last_error { 'HTTP 500' }
    end

    trait :all_events do
      events { WebhookSubscription::SUPPORTED_EVENTS }
    end
  end

  factory :webhook_delivery do
    association :webhook_subscription
    event_type { 'transaction.created' }
    payload { { id: 1, amount: 42.50 } }
    response_code { 200 }
    success { true }
    duration_ms { 150 }
    delivered_at { Time.current }

    trait :failed do
      response_code { 500 }
      success { false }
      response_body { 'Internal Server Error' }
    end
  end
end

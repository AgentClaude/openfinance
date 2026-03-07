FactoryBot.define do
  factory :webhook_subscription do
    association :user
    association :household
    name { "#{Faker::App.name} Webhook" }
    url { "https://#{Faker::Internet.domain_name}/webhooks" }
    events { ['transaction.created'] }
    is_active { true }
    failure_count { 0 }

    trait :inactive do
      is_active { false }
    end

    trait :disabled do
      is_active { false }
      disabled_at { Time.current }
    end

    trait :failing do
      failure_count { 5 }
    end

    trait :all_events do
      events { WebhookSubscription::SUPPORTED_EVENTS }
    end
  end

  factory :webhook_event do
    association :webhook_subscription
    event_type { 'transaction.created' }
    payload { { id: SecureRandom.uuid, type: 'transaction.created', data: { amount: -50.00 } } }
    delivery_status { 'pending' }
    attempt { 1 }

    trait :delivered do
      delivery_status { 'delivered' }
      status_code { 200 }
      response_time_ms { rand(20.0..200.0).round(2) }
      delivered_at { Time.current }
    end

    trait :failed do
      delivery_status { 'failed' }
      error_message { 'Connection refused' }
    end
  end
end

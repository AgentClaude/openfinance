FactoryBot.define do
  factory :notification do
    association :user
    association :household

    title { 'Test Notification' }
    body { 'Test notification body' }
    notification_type { 'system_update' }
    priority { 'normal' }
    is_read { false }
    data { {} }

    trait :budget_alert do
      title { 'Budget Alert: Dining' }
      notification_type { 'budget_alert' }
    end

    trait :bill_due do
      title { 'Bill due soon: Netflix' }
      notification_type { 'transaction_alert' }
    end

    trait :large_transaction do
      title { 'Large Transaction Detected' }
      notification_type { 'large_transaction' }
      priority { 'high' }
    end

    trait :read do
      is_read { true }
      read_at { Time.current }
    end
  end
end

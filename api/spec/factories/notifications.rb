FactoryBot.define do
  factory :notification do
    association :user
    household { user.household }
    title { 'Test Notification' }
    body { 'Test notification body' }
    notification_type { 'budget_alert' }
    priority { 'normal' }
    is_read { false }
    data { {} }

    trait :budget_alert do
      notification_type { 'budget_alert' }
      title { 'Budget Alert: Food' }
      data do
        {
          category_id: SecureRandom.uuid,
          category_name: 'Food',
          amount_spent: 8500,
          budget_amount: 10000,
          percentage: 85.0,
          month: Date.current.beginning_of_month.to_s,
          threshold: 80
        }
      end
    end

    trait :large_transaction do
      notification_type { 'large_transaction' }
      title { 'Large Transaction Detected' }
      priority { 'high' }
      data do
        {
          amount: 50000,
          merchant_name: 'Best Buy',
          account_name: 'Checking'
        }
      end
    end

    trait :read do
      is_read { true }
      read_at { Time.current }
    end
  end
end

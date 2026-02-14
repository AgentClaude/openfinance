FactoryBot.define do
  factory :notification_preference do
    association :user
    notification_type { 'budget_exceeded' }
    channel { 'in_app' }
    enabled { true }
  end
end

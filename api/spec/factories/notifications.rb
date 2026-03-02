FactoryBot.define do
  factory :notification do
    association :user
    association :household

    title { Faker::Lorem.sentence(word_count: 4) }
    body { Faker::Lorem.paragraph }
    notification_type { 'budget_alert' }
    priority { 'normal' }
    is_read { false }
  end
end

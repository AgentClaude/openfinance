FactoryBot.define do
  factory :merchant_mapping do
    association :household
    raw_pattern { Faker::Company.name.downcase }
    clean_name { Faker::Company.name }
    match_type { 'contains' }
    is_active { true }
    applied_count { 0 }

    trait :exact do
      match_type { 'exact' }
    end

    trait :starts_with do
      match_type { 'starts_with' }
    end

    trait :inactive do
      is_active { false }
    end
  end
end

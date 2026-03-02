FactoryBot.define do
  factory :categorization_rule do
    household
    category { association :category, household: household }
    match_field { 'merchant_name' }
    match_type { 'contains' }
    sequence(:match_value) { |n| "merchant_#{n}" }
    priority { 0 }
    is_active { true }
  end
end

FactoryBot.define do
  factory :categorization_rule do
    household
    category
    match_field { 'merchant_name' }
    match_type { 'contains' }
    sequence(:match_value) { |n| "merchant_#{n}" }
    is_active { true }
    priority { 0 }
  end
end

FactoryBot.define do
  factory :plaid_category_mapping do
    association :household
    association :category
    plaid_primary { 'FOOD_AND_DRINK' }
    plaid_detailed { nil }
    is_default { true }
  end
end

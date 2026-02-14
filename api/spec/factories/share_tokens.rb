FactoryBot.define do
  factory :share_token do
    association :user
    widget_type { 'net_worth' }
    config { {} }
  end
end

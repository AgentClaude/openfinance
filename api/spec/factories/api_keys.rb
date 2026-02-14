FactoryBot.define do
  factory :api_key do
    association :user
    name { Faker::App.name }
  end
end

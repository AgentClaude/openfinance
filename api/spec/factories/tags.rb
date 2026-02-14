FactoryBot.define do
  factory :tag do
    association :household
    name { Faker::Lorem.word }
    color_hex { '#3B82F6' }
    is_active { true }
  end
end

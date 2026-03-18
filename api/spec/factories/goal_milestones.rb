FactoryBot.define do
  factory :goal_milestone do
    association :goal
    percentage { 25 }
    amount_at_milestone_cents { 25000 }
    achieved_at { Time.current }
  end
end

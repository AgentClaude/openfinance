FactoryBot.define do
  factory :budget do
    association :household
    name { 'Monthly Budget' }
    start_date { Date.current.beginning_of_month }
    end_date { Date.current.end_of_month }
    period_type { 'monthly' }
    is_active { true }
  end

  factory :budget_item do
    association :budget
    association :category
    month { Date.current.beginning_of_month }
    amount_cents { 10000 }
    currency { 'USD' }
    rollover_cents { 0 }
  end
end

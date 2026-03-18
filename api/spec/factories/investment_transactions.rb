FactoryBot.define do
  factory :investment_transaction do
    account
    security
    transaction_type { 'dividend' }
    amount_cents { 5000 }
    date { Date.current }
    currency { 'USD' }

    trait :buy do
      transaction_type { 'buy' }
      quantity { 10 }
      price_cents { 15000 }
      amount_cents { 150000 }
    end

    trait :sell do
      transaction_type { 'sell' }
      quantity { 5 }
      price_cents { 16000 }
      amount_cents { 80000 }
    end

    trait :interest do
      transaction_type { 'interest' }
      amount_cents { 1500 }
    end

    trait :capital_gain do
      transaction_type { 'capital_gain' }
      amount_cents { 10000 }
    end
  end
end

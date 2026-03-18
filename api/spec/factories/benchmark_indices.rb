FactoryBot.define do
  factory :benchmark_index do
    symbol { "SPY" }
    name { "S&P 500 (SPY)" }
    description { "SPDR S&P 500 ETF Trust" }
    currency { "USD" }

    trait :with_data_points do
      after(:create) do |index|
        12.times do |i|
          date = (12 - i).months.ago.to_date.beginning_of_month
          create(:benchmark_data_point,
            benchmark_index: index,
            date: date,
            close_price: 450 + (i * 10) + rand(-5..5)
          )
        end
      end
    end
  end

  factory :benchmark_data_point do
    benchmark_index
    date { Date.current.beginning_of_month }
    close_price { 500.00 }
  end
end

require 'rails_helper'

RSpec.describe "Benchmark Comparison Query", type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:headers) { auth_headers(user) }
  let(:account) { create(:account, household: household, account_type: 'investment') }
  let(:security) { create(:security, symbol: "AAPL", name: "Apple Inc.") }
  let(:benchmark) { create(:benchmark_index, symbol: "SPY") }

  let(:query) do
    <<~GQL
      query BenchmarkComparison($benchmarkSymbol: String, $months: Int, $accountId: ID) {
        benchmarkComparison(benchmarkSymbol: $benchmarkSymbol, months: $months, accountId: $accountId) {
          benchmarkName
          benchmarkSymbol
          periodMonths
          portfolioReturn
          benchmarkReturn
          alpha
          outperforming
          dataPoints {
            date
            portfolioValue
            benchmarkValue
          }
        }
      }
    GQL
  end

  before do
    # Create portfolio data
    [6, 5, 4, 3, 2, 1, 0].each_with_index do |months_ago, i|
      date = months_ago.months.ago.to_date.beginning_of_month
      price = 15000 + (i * 1000) # Growing from $150 to $210
      create(:holding,
        account: account,
        security: security,
        as_of_date: date,
        current_price_cents: price,
        cost_basis_cents: 14000,
        quantity: 10,
        currency: "USD"
      )
    end

    # Create benchmark data
    [6, 5, 4, 3, 2, 1, 0].each_with_index do |months_ago, i|
      date = months_ago.months.ago.to_date.beginning_of_month
      price = 500 + (i * 15) # Growing from $500 to $590
      create(:benchmark_data_point,
        benchmark_index: benchmark,
        date: date,
        close_price: price
      )
    end
  end

  it "returns benchmark comparison data" do
    post "/graphql", params: { query: query, variables: { months: 12 } }, headers: headers, as: :json
    expect(response).to have_http_status(:success)

    data = JSON.parse(response.body)["data"]["benchmarkComparison"]
    expect(data["benchmarkName"]).to eq("S&P 500 (SPY)")
    expect(data["benchmarkSymbol"]).to eq("SPY")
    expect(data["periodMonths"]).to eq(12)
    expect(data["dataPoints"]).not_to be_empty
  end

  it "calculates positive alpha when portfolio outperforms" do
    post "/graphql", params: { query: query, variables: { months: 12 } }, headers: headers, as: :json

    data = JSON.parse(response.body)["data"]["benchmarkComparison"]
    # Portfolio grows ~40% (150→210), benchmark grows ~18% (500→590)
    expect(data["portfolioReturn"]).to be > data["benchmarkReturn"]
    expect(data["alpha"]).to be > 0
    expect(data["outperforming"]).to be true
  end

  it "returns empty data for unauthenticated request" do
    post "/graphql", params: { query: query, variables: { months: 12 } }, as: :json
    data = JSON.parse(response.body)["data"]["benchmarkComparison"]
    expect(data["dataPoints"]).to be_empty
  end

  it "accepts custom benchmark symbol" do
    qqq = create(:benchmark_index, symbol: "QQQ", name: "Nasdaq 100")
    create(:benchmark_data_point, benchmark_index: qqq, date: 6.months.ago.to_date.beginning_of_month, close_price: 400)
    create(:benchmark_data_point, benchmark_index: qqq, date: Date.current.beginning_of_month, close_price: 440)

    post "/graphql", params: { query: query, variables: { benchmarkSymbol: "QQQ", months: 12 } }, headers: headers, as: :json
    data = JSON.parse(response.body)["data"]["benchmarkComparison"]
    expect(data["benchmarkSymbol"]).to eq("QQQ")
    expect(data["benchmarkName"]).to eq("Nasdaq 100")
  end

  it "filters by account_id" do
    other_account = create(:account, household: household, account_type: 'investment')

    post "/graphql", params: { query: query, variables: { months: 12, accountId: other_account.id } }, headers: headers, as: :json
    data = JSON.parse(response.body)["data"]["benchmarkComparison"]
    # No holdings in other_account, so data_points should be empty
    expect(data["dataPoints"]).to be_empty
  end
end

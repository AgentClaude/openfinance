require 'rails_helper'

RSpec.describe Benchmarks::ComparisonService, type: :service do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:account) { create(:account, household: household, account_type: 'investment', current_balance_cents: 100_000_00) }
  let(:security) { create(:security, symbol: "AAPL", name: "Apple Inc.") }
  let(:benchmark) { create(:benchmark_index, symbol: "SPY") }

  def create_holding(date:, price_cents:, quantity: 10)
    create(:holding,
      account: account,
      security: security,
      as_of_date: date,
      current_price_cents: price_cents,
      cost_basis_cents: 15000,
      quantity: quantity,
      currency: "USD"
    )
  end

  def create_benchmark_point(date:, price:)
    create(:benchmark_data_point,
      benchmark_index: benchmark,
      date: date,
      close_price: price
    )
  end

  describe "#call" do
    context "with sufficient data" do
      before do
        # Portfolio: starts at $1500 (10 * $150), grows to $2000 (10 * $200) = +33.3%
        create_holding(date: 6.months.ago.to_date.beginning_of_month, price_cents: 15000)
        create_holding(date: 3.months.ago.to_date.beginning_of_month, price_cents: 17500)
        create_holding(date: Date.current.beginning_of_month, price_cents: 20000)

        # Benchmark: starts at 500, grows to 550 = +10%
        create_benchmark_point(date: 6.months.ago.to_date.beginning_of_month, price: 500)
        create_benchmark_point(date: 3.months.ago.to_date.beginning_of_month, price: 525)
        create_benchmark_point(date: Date.current.beginning_of_month, price: 550)
      end

      it "returns comparison data" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:success]).to be true
        expect(result[:benchmark_name]).to eq("S&P 500 (SPY)")
        expect(result[:benchmark_symbol]).to eq("SPY")
        expect(result[:data_points]).not_to be_empty
      end

      it "calculates portfolio return" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:portfolio_return]).to be > 0
      end

      it "calculates benchmark return" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:benchmark_return]).to be > 0
      end

      it "calculates alpha (portfolio - benchmark)" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:alpha]).to eq(result[:portfolio_return] - result[:benchmark_return])
      end

      it "sets outperforming flag correctly" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:outperforming]).to eq(result[:alpha] > 0)
      end

      it "normalizes both series to 100 at start" do
        result = described_class.new(household: household, months: 12).call
        first_point = result[:data_points].first
        expect(first_point[:portfolio_value]).to eq(100.0)
        expect(first_point[:benchmark_value]).to eq(100.0)
      end
    end

    context "with account_id filter" do
      let(:other_account) { create(:account, household: household, account_type: 'investment') }

      before do
        create_holding(date: 6.months.ago.to_date.beginning_of_month, price_cents: 15000)
        create_holding(date: Date.current.beginning_of_month, price_cents: 20000)
        create_benchmark_point(date: 6.months.ago.to_date.beginning_of_month, price: 500)
        create_benchmark_point(date: Date.current.beginning_of_month, price: 550)
      end

      it "filters by account" do
        result = described_class.new(household: household, months: 12, account_id: other_account.id).call
        expect(result[:success]).to be false
      end
    end

    context "when benchmark not found" do
      it "returns error result" do
        result = described_class.new(household: household, benchmark_symbol: "INVALID").call
        expect(result[:success]).to be false
        expect(result[:error]).to include("not found")
        expect(result[:data_points]).to be_empty
      end
    end

    context "when insufficient portfolio data" do
      before do
        create_benchmark_point(date: 6.months.ago.to_date, price: 500)
        create_benchmark_point(date: Date.current, price: 550)
      end

      it "returns error result" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:success]).to be false
        expect(result[:error]).to include("portfolio data")
      end
    end

    context "when insufficient benchmark data" do
      before do
        benchmark # create benchmark but no data points
        create_holding(date: 6.months.ago.to_date, price_cents: 15000)
        create_holding(date: Date.current, price_cents: 20000)
      end

      it "returns error result" do
        result = described_class.new(household: household, months: 12).call
        expect(result[:success]).to be false
        expect(result[:error]).to include("benchmark data")
      end
    end
  end
end

require 'rails_helper'

RSpec.describe BenchmarkIndex, type: :model do
  subject(:index) { build(:benchmark_index) }

  describe "validations" do
    it { is_expected.to be_valid }
    it { is_expected.to validate_presence_of(:symbol) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:currency) }
    it { is_expected.to validate_length_of(:currency).is_equal_to(3) }

    it "validates symbol uniqueness case-insensitively" do
      create(:benchmark_index, symbol: "SPY")
      duplicate = build(:benchmark_index, symbol: "spy")
      expect(duplicate).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to have_many(:benchmark_data_points).dependent(:destroy) }
  end

  describe ".sp500" do
    it "returns the SPY benchmark" do
      spy = create(:benchmark_index, symbol: "SPY")
      create(:benchmark_index, symbol: "QQQ", name: "Nasdaq 100")
      expect(BenchmarkIndex.sp500).to eq(spy)
    end

    it "returns nil when SPY doesn't exist" do
      expect(BenchmarkIndex.sp500).to be_nil
    end
  end

  describe "#price_at" do
    let(:index) { create(:benchmark_index) }

    before do
      create(:benchmark_data_point, benchmark_index: index, date: "2025-01-01", close_price: 450)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-02-01", close_price: 460)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-03-01", close_price: 470)
    end

    it "returns exact date price" do
      expect(index.price_at(Date.parse("2025-02-01"))).to eq(460)
    end

    it "returns nearest previous date price" do
      expect(index.price_at(Date.parse("2025-02-15"))).to eq(460)
    end

    it "returns nil for dates before any data" do
      expect(index.price_at(Date.parse("2024-12-01"))).to be_nil
    end
  end

  describe "#normalized_returns" do
    let(:index) { create(:benchmark_index) }

    before do
      create(:benchmark_data_point, benchmark_index: index, date: "2025-01-01", close_price: 500)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-02-01", close_price: 525)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-03-01", close_price: 550)
    end

    it "normalizes to 100 at start" do
      result = index.normalized_returns(Date.parse("2025-01-01"), Date.parse("2025-03-01"))
      expect(result.first[:value]).to eq(100.0)
    end

    it "calculates relative returns" do
      result = index.normalized_returns(Date.parse("2025-01-01"), Date.parse("2025-03-01"))
      expect(result.last[:value]).to eq(110.0) # 550/500 * 100
    end

    it "returns empty for no data in range" do
      result = index.normalized_returns(Date.parse("2020-01-01"), Date.parse("2020-06-01"))
      expect(result).to be_empty
    end
  end

  describe "symbol normalization" do
    it "upcases symbols" do
      index = create(:benchmark_index, symbol: "spy")
      expect(index.symbol).to eq("SPY")
    end
  end
end

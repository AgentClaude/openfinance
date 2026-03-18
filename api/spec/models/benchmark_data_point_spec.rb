require 'rails_helper'

RSpec.describe BenchmarkDataPoint, type: :model do
  subject(:point) { build(:benchmark_data_point) }

  describe "validations" do
    it { is_expected.to be_valid }
    it { is_expected.to validate_presence_of(:date) }
    it { is_expected.to validate_presence_of(:close_price) }
    it { is_expected.to validate_numericality_of(:close_price).is_greater_than(0) }

    it "validates uniqueness of date per benchmark index" do
      index = create(:benchmark_index)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-01-01")
      duplicate = build(:benchmark_data_point, benchmark_index: index, date: "2025-01-01")
      expect(duplicate).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:benchmark_index) }
  end

  describe "scopes" do
    let(:index) { create(:benchmark_index) }

    before do
      create(:benchmark_data_point, benchmark_index: index, date: "2025-01-01", close_price: 450)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-02-01", close_price: 460)
      create(:benchmark_data_point, benchmark_index: index, date: "2025-03-01", close_price: 470)
    end

    it ".chronological orders by date ascending" do
      dates = index.benchmark_data_points.chronological.pluck(:date)
      expect(dates).to eq(dates.sort)
    end

    it ".between filters by date range" do
      points = index.benchmark_data_points.between(Date.parse("2025-01-15"), Date.parse("2025-02-15"))
      expect(points.count).to eq(1)
      expect(points.first.close_price).to eq(460)
    end
  end
end

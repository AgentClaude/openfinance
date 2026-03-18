class BenchmarkIndex < ApplicationRecord
  has_many :benchmark_data_points, dependent: :destroy

  validates :symbol, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  validates :currency, presence: true, length: { is: 3 }

  scope :by_symbol, ->(symbol) { where(symbol: symbol.upcase) }

  before_validation :normalize_symbol

  def self.sp500
    find_by(symbol: "SPY")
  end

  def price_at(date)
    benchmark_data_points
      .where("date <= ?", date)
      .order(date: :desc)
      .first
      &.close_price
  end

  def prices_between(start_date, end_date)
    benchmark_data_points
      .where(date: start_date..end_date)
      .order(:date)
  end

  def normalized_returns(start_date, end_date)
    points = prices_between(start_date, end_date)
    return [] if points.empty?

    base_price = points.first.close_price
    return [] if base_price.zero?

    points.map do |point|
      {
        date: point.date.iso8601,
        value: ((point.close_price / base_price) * 100).round(2)
      }
    end
  end

  private

  def normalize_symbol
    self.symbol = symbol&.upcase&.strip
  end
end

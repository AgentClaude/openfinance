class BenchmarkDataPoint < ApplicationRecord
  belongs_to :benchmark_index

  validates :date, presence: true
  validates :close_price, presence: true, numericality: { greater_than: 0 }
  validates :date, uniqueness: { scope: :benchmark_index_id }

  scope :chronological, -> { order(:date) }
  scope :between, ->(start_date, end_date) { where(date: start_date..end_date) }
end

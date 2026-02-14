class CsvImport < ApplicationRecord
  belongs_to :household
  belongs_to :account

  validates :filename, presence: true
  validates :status, inclusion: { in: %w[pending processing completed failed] }

  scope :recent, -> { order(created_at: :desc) }
end

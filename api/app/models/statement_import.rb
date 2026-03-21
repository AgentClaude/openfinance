class StatementImport < ApplicationRecord
  belongs_to :household
  belongs_to :account

  validates :filename, presence: true
  validates :format_type, inclusion: { in: %w[ofx qfx] }
  validates :status, inclusion: { in: %w[pending processing completed failed] }

  scope :recent, -> { order(created_at: :desc) }
end

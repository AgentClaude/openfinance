# SyncLog model for OpenFinance
# Tracks synchronization attempts with external providers

class SyncLog < ApplicationRecord
  # Associations
  belongs_to :connection, class_name: 'AccountConnection', foreign_key: 'connection_id'

  # Validations
  validates :connection, presence: true
  validates :status, inclusion: { in: %w[started completed failed] }
  validates :transactions_added, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :transactions_updated, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Enums
  enum :status, { started: 'started', completed: 'completed', failed: 'failed' }

  # Scopes
  scope :recent, -> { where('started_at >= ?', 24.hours.ago) }
  scope :successful, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :in_progress, -> { where(status: 'started', completed_at: nil) }

  # Helper methods
  def duration
    return nil unless started_at && completed_at
    completed_at - started_at
  end

  def duration_in_seconds
    duration&.round(2)
  end

  def successful?
    status == 'completed'
  end

  def in_progress?
    status == 'started' && completed_at.nil?
  end

  def total_transactions_processed
    (transactions_added || 0) + (transactions_updated || 0)
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [
        :duration_in_seconds, :successful?, :in_progress?, 
        :total_transactions_processed
      ]
    ))
  end
end
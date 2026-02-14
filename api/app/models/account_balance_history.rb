# AccountBalanceHistory model for OpenFinance
# Tracks daily account balance snapshots

class AccountBalanceHistory < ApplicationRecord

  # Associations
  belongs_to :account

  # Money attributes
  monetize :current_balance_cents, as: :balance

  # Validations
  validates :account, presence: true
  validates :date, presence: true, uniqueness: { scope: :account_id }
  validates :balance, presence: true, numericality: true

  # Enums removed - currency is now just a string field

  # Scopes
  scope :for_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }
  scope :recent, ->(days = 30) { where('date >= ?', days.days.ago) }
  scope :ordered, -> { order(:date) }

  # Callbacks
  before_validation :set_currency

  # Helper methods
  def balance_change_from_previous
    previous_record = account.balance_histories
                            .where('date < ?', date)
                            .order(:date)
                            .last
    return 0 unless previous_record
    
    balance - previous_record.balance
  end

  # API serialization  
  def as_json(options = {})
    super(options.merge(
      methods: [:balance_change_from_previous]
    ))
  end

  private

  def set_currency
    self.currency ||= account&.currency || 'USD'
  end
end
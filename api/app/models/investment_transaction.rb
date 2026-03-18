class InvestmentTransaction < ApplicationRecord
  # Associations
  belongs_to :account
  belongs_to :security
  has_one :household, through: :account

  # Enums
  enum :transaction_type, {
    dividend: 'dividend',
    buy: 'buy',
    sell: 'sell',
    interest: 'interest',
    fee: 'fee',
    capital_gain: 'capital_gain'
  }

  # Money
  monetize :amount_cents
  monetize :price_cents, allow_nil: true

  # Validations
  validates :transaction_type, presence: true
  validates :amount_cents, presence: true
  validates :date, presence: true
  validates :currency, presence: true, length: { is: 3 }
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :plaid_investment_transaction_id, uniqueness: true, allow_blank: true

  # Scopes
  scope :dividends, -> { where(transaction_type: 'dividend') }
  scope :buys, -> { where(transaction_type: 'buy') }
  scope :sells, -> { where(transaction_type: 'sell') }
  scope :income, -> { where(transaction_type: %w[dividend interest capital_gain]) }
  scope :for_account, ->(account_id) { where(account_id: account_id) }
  scope :for_security, ->(security_id) { where(security_id: security_id) }
  scope :in_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }
  scope :in_year, ->(year) { where(date: Date.new(year, 1, 1)..Date.new(year, 12, 31)) }
  scope :recent, -> { order(date: :desc) }
  scope :chronological, -> { order(date: :asc) }

  # Callbacks
  before_validation :set_defaults

  # Class methods
  def self.dividend_summary(household, year: Date.current.year, account_id: nil)
    scope = joins(:account)
            .where(accounts: { household_id: household.id })
            .dividends
            .in_year(year)
    scope = scope.for_account(account_id) if account_id.present?

    total_cents = scope.sum(:amount_cents)
    by_security = scope.joins(:security)
                       .group('securities.symbol', 'securities.name')
                       .sum(:amount_cents)
                       .map { |(symbol, name), cents| { symbol: symbol, name: name, amount: cents / 100.0 } }
                       .sort_by { |d| -d[:amount] }

    by_month = scope.group("to_char(date, 'YYYY-MM')")
                    .sum(:amount_cents)
                    .map { |month, cents| { month: month, amount: cents / 100.0 } }
                    .sort_by { |d| d[:month] }

    {
      total_dividends: total_cents / 100.0,
      by_security: by_security,
      by_month: by_month,
      transaction_count: scope.count
    }
  end

  def self.income_summary(household, year: Date.current.year, account_id: nil)
    scope = joins(:account)
            .where(accounts: { household_id: household.id })
            .income
            .in_year(year)
    scope = scope.for_account(account_id) if account_id.present?

    by_type = scope.group(:transaction_type)
                   .sum(:amount_cents)
                   .transform_values { |v| v / 100.0 }

    {
      total_income: scope.sum(:amount_cents) / 100.0,
      dividends: by_type['dividend'] || 0.0,
      interest: by_type['interest'] || 0.0,
      capital_gains: by_type['capital_gain'] || 0.0
    }
  end

  private

  def set_defaults
    self.currency ||= account&.currency || 'USD'
    self.metadata ||= {}
  end
end

# Account model for OpenFinance
# Represents bank accounts, credit cards, investments, and other financial accounts

class Account < ApplicationRecord

  # Associations
  belongs_to :household
  belongs_to :connection, class_name: 'AccountConnection', foreign_key: 'connection_id', optional: true
  has_many :transactions, dependent: :destroy
  has_many :holdings, dependent: :destroy
  has_many :investment_transactions, dependent: :destroy
  has_many :balance_histories, class_name: 'AccountBalanceHistory', dependent: :destroy
  has_many :balance_adjustments, dependent: :destroy
  has_many :shared_accounts, dependent: :destroy
  has_many_attached :statements
  has_many :shared_with_users, through: :shared_accounts, source: :shared_with_user

  # Money attributes
  monetize :current_balance_cents
  monetize :available_balance_cents, allow_nil: true
  monetize :credit_limit_cents, allow_nil: true

  # Validations
  validates :household, presence: true
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :account_type, presence: true, inclusion: { 
    in: %w[checking savings credit_card loan mortgage investment retirement crypto real_estate vehicle other_asset other_liability cash manual]
  }
  validates :account_subtype, inclusion: { 
    in: %w[401k ira roth_ira 529 brokerage hsa cd money_market auto_loan student_loan personal_loan heloc other]
  }, allow_nil: true
  validates :currency, inclusion: { in: %w[USD EUR GBP CAD AUD] }, allow_blank: true
  validates :mask, format: { with: /\A\d{4}\z/ }, allow_blank: true
  validates :current_balance, presence: true, numericality: true

  # Enums
  enum :account_type, {
    checking: 'checking',
    savings: 'savings', 
    credit_card: 'credit_card',
    loan: 'loan',
    mortgage: 'mortgage',
    investment: 'investment',
    retirement: 'retirement',
    crypto: 'crypto',
    real_estate: 'real_estate',
    vehicle: 'vehicle',
    other_asset: 'other_asset',
    other_liability: 'other_liability',
    cash: 'cash',
    manual: 'manual'
  }

  enum :account_subtype, {
    '401k': '401k',
    ira: 'ira',
    roth_ira: 'roth_ira',
    '529': '529',
    brokerage: 'brokerage',
    hsa: 'hsa',
    cd: 'cd',
    money_market: 'money_market',
    auto_loan: 'auto_loan',
    student_loan: 'student_loan',
    personal_loan: 'personal_loan',
    heloc: 'heloc',
    other: 'other'
  }

  # Scopes
  scope :visible, -> { where(is_hidden: false) }
  scope :hidden, -> { where(is_hidden: true) }
  scope :manual_accounts, -> { where(is_manual: true) }
  scope :connected_accounts, -> { where(is_manual: false) }
  scope :by_type, ->(type) { where(account_type: type) }
  scope :assets, -> { where(account_type: %w[checking savings investment retirement crypto real_estate vehicle other_asset cash]) }
  scope :liabilities, -> { where(account_type: %w[credit_card loan mortgage other_liability]) }
  scope :ordered, -> { order(:display_order, :name) }

  # Callbacks
  before_create :set_default_currency
  before_create :set_default_display_order
  after_update :track_balance_history, if: :saved_change_to_current_balance_cents?

  # Balance tracking
  def track_balance_history
    balance_histories.find_or_create_by(date: Date.current) do |history|
      history.balance = current_balance
    end
  end

  def balance_history(days = 30)
    end_date = Date.current
    start_date = end_date - days.days
    
    balance_histories
      .where(date: start_date..end_date)
      .order(:date)
  end

  def balance_change_since(date)
    historical_balance = balance_histories.where('date <= ?', date).order(:date).last&.balance
    return 0 unless historical_balance
    
    current_balance - historical_balance
  end

  # Account type helpers
  def asset?
    %w[checking savings investment retirement crypto real_estate vehicle other_asset cash].include?(account_type)
  end

  def liability?
    %w[credit_card loan mortgage other_liability].include?(account_type)
  end

  def depository?
    %w[checking savings].include?(account_type)
  end

  def credit_account?
    account_type == 'credit_card'
  end

  def investment_account?
    %w[investment retirement].include?(account_type)
  end

  def loan_account?
    %w[loan mortgage].include?(account_type)
  end

  # Display methods
  def display_name
    name.present? ? name : "#{account_type.titleize} #{mask}"
  end

  def display_balance
    if liability? && current_balance > 0
      -current_balance # Show liabilities as negative
    else
      current_balance
    end
  end

  def masked_number
    mask.present? ? "****#{mask}" : nil
  end

  def account_type_display
    account_type.humanize
  end

  def subtype_display; account_subtype
    account_subtype&.humanize || account_type_display
  end

  # Transaction helpers
  def recent_transactions(limit = 10)
    transactions.order(date: :desc, created_at: :desc).limit(limit)
  end

  def transactions_in_period(start_date, end_date)
    transactions.where(date: start_date..end_date)
  end

  def monthly_spending(date = Date.current)
    start_date = date.beginning_of_month
    end_date = date.end_of_month
    
    Money.new(transactions.where(date: start_date..end_date).where('amount_cents < 0').sum(:amount_cents).abs)
  end

  def monthly_deposits(date = Date.current)
    start_date = date.beginning_of_month
    end_date = date.end_of_month
    
    Money.new(transactions.where(date: start_date..end_date).where('amount_cents >= 0').sum(:amount_cents))
  end

  # Credit card specific methods
  def credit_utilization
    return 0 unless credit_account? && credit_limit.present? && credit_limit > 0
    
    utilized = current_balance > 0 ? current_balance : 0
    (utilized / credit_limit * 100).round(2)
  end

  def available_credit
    return nil unless credit_account? && credit_limit.present?
    
    credit_limit - (current_balance > 0 ? current_balance : 0)
  end

  # Investment account specific methods
  def total_holdings_value
    return 0 unless investment_account?
    
    holdings.sum(:current_value) || 0
  end

  def portfolio_performance
    return {} unless investment_account?
    
    total_value = total_holdings_value
    total_cost = holdings.sum(:cost_basis) || 0
    
    return {} if total_cost.zero?
    
    gain_loss = total_value - total_cost
    percentage = (gain_loss / total_cost * 100).round(2)
    
    {
      total_value: total_value,
      total_cost: total_cost,
      gain_loss: gain_loss,
      percentage: percentage
    }
  end

  # Connection status
  def connected?
    connection.present? && connection.active?
  end

  def connection_status
    return 'manual' if is_manual?
    return 'disconnected' unless connection.present?
    
    connection.status
  end

  def needs_attention?
    connected? && connection.has_errors?
  end

  def last_updated
    connection&.last_synced_at || updated_at
  end

  # Sync management
  def sync_transactions!
    return false unless connected?
    
    connection.schedule_sync(priority: 'high')
  end

  # Search functionality
  def self.search(query)
    return none if query.blank?
    
    where('name ILIKE ? OR official_name ILIKE ?', "%#{query}%", "%#{query}%")
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [
        :display_name, :display_balance, :masked_number, :account_type_display,
        :subtype_display, :connection_status, :needs_attention?, :last_updated,
        :asset?, :liability?, :credit_utilization, :available_credit
      ],
      include: {
        connection: {
          only: [:id, :status, :provider, :institution_name],
          methods: [:error_display_message]
        }
      }
    ))
  end

  private

  def set_default_currency
    self.currency ||= 'USD'
  end

  def set_default_display_order
    return if display_order.present?
    
    max_order = household.accounts.maximum(:display_order) || 0
    self.display_order = max_order + 1
  end
end
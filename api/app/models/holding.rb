class Holding < ApplicationRecord

  # Associations
  belongs_to :account
  belongs_to :security
  has_one :household, through: :account

  # Validations
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :as_of_date, presence: true
  validates :currency, presence: true, length: { is: 3 }
  validates :account_id, uniqueness: { scope: [:security_id, :as_of_date] }

  # Money fields
  monetize :current_price_cents, allow_nil: true
  monetize :market_value_cents, allow_nil: true
  monetize :cost_basis_cents, allow_nil: true

  # Scopes
  scope :as_of, ->(date) { where(as_of_date: date) }
  scope :latest, -> { order(as_of_date: :desc) }
  scope :for_account, ->(account) { where(account: account) }
  scope :for_security, ->(security) { where(security: security) }
  scope :positive_quantity, -> { where('quantity > 0') }
  scope :by_value, -> { order(market_value_cents: :desc) }

  # Callbacks
  before_save :calculate_market_value
  before_validation :set_defaults

  # Instance methods
  def current_value
    return Money.new(0, currency) if quantity.zero? || current_price_cents.nil?
    
    Money.new((quantity * current_price_cents).to_i, currency)
  end

  def cost_basis_total
    return Money.new(0, currency) if quantity.zero? || cost_basis_cents.nil?
    
    Money.new((quantity * cost_basis_cents).to_i, currency)
  end

  def unrealized_gain_loss
    return Money.new(0, currency) if cost_basis_total.zero?
    
    current_value - cost_basis_total
  end

  def unrealized_gain_loss_percentage
    return 0.0 if cost_basis_total.zero? || cost_basis_total.cents.zero?
    
    (unrealized_gain_loss.cents.to_f / cost_basis_total.cents * 100).round(2)
  end

  def is_profitable?
    unrealized_gain_loss.positive?
  end

  def is_losing?
    unrealized_gain_loss.negative?
  end

  def weight_in_account
    return 0.0 if account.total_holdings_value.zero?
    
    (current_value.cents.to_f / account.total_holdings_value * 100).round(2)
  end

  def weight_in_portfolio
    return 0.0 if household.total_investment_value.zero?
    
    (current_value.cents.to_f / household.total_investment_value * 100).round(2)
  end

  def days_held
    return 0 unless created_at
    
    (Date.current - created_at.to_date).to_i
  end

  def is_recent_purchase?(days = 30)
    days_held <= days
  end

  def performance_since_purchase
    return 0.0 if cost_basis_total.zero?
    
    unrealized_gain_loss_percentage
  end

  # Historical data and trends
  def price_history(period = 1.month)
    start_date = period.ago.to_date
    
    Holding.where(account: account, security: security)
           .where('as_of_date >= ?', start_date)
           .where('as_of_date <= ?', as_of_date)
           .order(:as_of_date)
           .pluck(:as_of_date, :current_price_cents, :quantity)
           .map do |date, price, qty|
      {
        date: date,
        price: Money.new(price || 0, currency),
        quantity: qty,
        value: Money.new((qty * (price || 0)).to_i, currency)
      }
    end
  end

  def quantity_change_from_previous
    previous = previous_holding
    return quantity if previous.nil?
    
    quantity - previous.quantity
  end

  def value_change_from_previous
    previous = previous_holding
    return current_value if previous.nil?
    
    current_value - previous.current_value
  end

  def previous_holding
    Holding.where(account: account, security: security)
           .where('as_of_date < ?', as_of_date)
           .order(:as_of_date)
           .last
  end

  def next_holding
    Holding.where(account: account, security: security)
           .where('as_of_date > ?', as_of_date)
           .order(:as_of_date)
           .first
  end

  # Plaid integration
  def update_from_plaid_data(plaid_holding_data)
    update!(
      quantity: plaid_holding_data[:quantity],
      current_price_cents: (plaid_holding_data[:institution_price] * 100).to_i,
      market_value_cents: (plaid_holding_data[:institution_value] * 100).to_i,
      cost_basis_cents: plaid_holding_data[:cost_basis] ? (plaid_holding_data[:cost_basis] * 100).to_i : cost_basis_cents,
      currency: plaid_holding_data[:iso_currency_code] || currency
    )
  end

  def self.create_or_update_from_plaid(account, security, plaid_holding_data, as_of_date = Date.current)
    holding = find_or_initialize_by(
      account: account,
      security: security,
      as_of_date: as_of_date
    )
    
    holding.assign_attributes(
      quantity: plaid_holding_data[:quantity],
      current_price_cents: plaid_holding_data[:institution_price] ? (plaid_holding_data[:institution_price] * 100).to_i : nil,
      market_value_cents: plaid_holding_data[:institution_value] ? (plaid_holding_data[:institution_value] * 100).to_i : nil,
      cost_basis_cents: plaid_holding_data[:cost_basis] ? (plaid_holding_data[:cost_basis] * 100).to_i : nil,
      currency: plaid_holding_data[:iso_currency_code] || account.currency,
      plaid_holding_id: plaid_holding_data[:account_id] + '_' + security.plaid_security_id
    )
    
    holding.save!
    holding
  end

  # Analytics and reporting
  def self.portfolio_summary_for_household(household, as_of_date = Date.current)
    holdings = joins(:account)
               .where(accounts: { household_id: household.id })
               .where(as_of_date: as_of_date)
               .includes(:security, :account)
    
    total_value = holdings.sum(&:current_value_cents)
    total_cost_basis = holdings.sum(&:cost_basis_total_cents)
    
    {
      total_holdings: holdings.count,
      total_value: Money.new(total_value, household.currency),
      total_cost_basis: Money.new(total_cost_basis, household.currency),
      total_gain_loss: Money.new(total_value - total_cost_basis, household.currency),
      total_gain_loss_percentage: total_cost_basis > 0 ? ((total_value - total_cost_basis).to_f / total_cost_basis * 100).round(2) : 0.0,
      holdings_by_type: holdings.joins(:security).group('securities.security_type').sum(&:current_value_cents),
      top_holdings: holdings.order(market_value_cents: :desc).limit(10)
    }
  end

  def self.allocation_summary_for_account(account, as_of_date = Date.current)
    holdings = where(account: account, as_of_date: as_of_date).includes(:security)
    total_value = holdings.sum(&:current_value_cents)
    
    return {} if total_value.zero?
    
    allocations = holdings.map do |holding|
      percentage = (holding.current_value.cents.to_f / total_value * 100).round(2)
      {
        security: holding.security,
        holding: holding,
        percentage: percentage,
        value: holding.current_value
      }
    end
    
    {
      total_value: Money.new(total_value, account.currency),
      allocations: allocations.sort_by { |a| -a[:percentage] },
      diversification_score: calculate_diversification_score(allocations)
    }
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :quantity, :as_of_date, :currency, :created_at, :updated_at],
      include: {
        security: { only: [:id, :symbol, :name, :security_type] }
      },
      methods: [
        :current_value, :cost_basis_total, :unrealized_gain_loss, 
        :unrealized_gain_loss_percentage, :weight_in_account, :is_profitable?
      ]
    ))
  end

  private

  def calculate_market_value
    if quantity.present? && current_price_cents.present?
      self.market_value_cents = (quantity * current_price_cents).to_i
    end
  end

  def set_defaults
    self.currency ||= account&.currency || 'USD'
    self.as_of_date ||= Date.current
  end

  def self.calculate_diversification_score(allocations)
    # Simple diversification score based on concentration
    # Higher score = better diversified (lower concentration)
    return 100 if allocations.empty?
    
    max_concentration = allocations.map { |a| a[:percentage] }.max
    concentration_penalty = max_concentration - 20 # Penalty if any holding > 20%
    
    [100 - [concentration_penalty, 0].max, 0].max.round(1)
  end

  def current_value_cents
    return 0 if quantity.nil? || current_price_cents.nil?
    
    (quantity * current_price_cents).to_i
  end

  def cost_basis_total_cents
    return 0 if quantity.nil? || cost_basis_cents.nil?
    
    (quantity * cost_basis_cents).to_i
  end
end
class Security < ApplicationRecord
  # Associations
  has_many :holdings, dependent: :destroy
  has_many :accounts, through: :holdings

  # Validations
  validates :symbol, presence: true, length: { minimum: 1, maximum: 20 }
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :symbol, uniqueness: { case_sensitive: false }
  validates :plaid_security_id, uniqueness: true, allow_blank: true
  validates :cusip, uniqueness: true, allow_blank: true
  validates :isin, uniqueness: true, allow_blank: true
  validates :currency, presence: true, length: { is: 3 }

  # Enums
  enum :security_type, {
    stock: 'stock',
    bond: 'bond',
    mutual_fund: 'mutual_fund',
    etf: 'etf',
    option: 'option',
    warrant: 'warrant',
    commodity: 'commodity',
    currency: 'currency',
    cryptocurrency: 'cryptocurrency',
    other: 'other'
  }

  # Scopes
  scope :by_symbol, ->(symbol) { where(symbol: symbol.upcase) }
  scope :by_type, ->(type) { where(security_type: type) }
  scope :by_exchange, ->(exchange) { where(exchange: exchange) }
  scope :with_holdings, -> { joins(:holdings).distinct }
  scope :search, ->(query) do
    where("symbol ILIKE ? OR name ILIKE ?", "%#{query}%", "%#{query}%")
  end

  # Callbacks
  before_validation :normalize_symbol
  before_validation :set_defaults

  # Instance methods
  def display_name
    "#{symbol} - #{name}"
  end

  def short_name
    return name if name.length <= 30
    
    "#{name[0..27]}..."
  end

  def total_holdings_value
    holdings.sum(&:market_value_cents) || 0
  end

  def total_quantity_held
    holdings.sum(&:quantity) || 0
  end

  def average_price
    return 0 if total_quantity_held.zero?
    
    total_holdings_value / total_quantity_held
  end

  def holding_accounts
    accounts.distinct
  end

  def is_held_by_household?(household)
    holding_accounts.joins(:household).where(households: { id: household.id }).exists?
  end

  def latest_holding
    holdings.order(:as_of_date).last
  end

  def current_price
    latest_holding&.current_price || Money.new(0, currency)
  end

  def price_change_from(previous_date)
    current_holding = latest_holding
    previous_holding = holdings.where('as_of_date <= ?', previous_date).order(:as_of_date).last
    
    return nil unless current_holding && previous_holding
    
    current_price_cents = current_holding.current_price_cents || 0
    previous_price_cents = previous_holding.current_price_cents || 0
    
    return 0 if previous_price_cents.zero?
    
    ((current_price_cents - previous_price_cents).to_f / previous_price_cents * 100).round(2)
  end

  def price_change_1d
    price_change_from(1.day.ago)
  end

  def price_change_1w
    price_change_from(1.week.ago)
  end

  def price_change_1m
    price_change_from(1.month.ago)
  end

  def price_change_1y
    price_change_from(1.year.ago)
  end

  # External data integration
  def fetch_current_price
    # Placeholder for external API integration (e.g., Alpha Vantage, Yahoo Finance)
    # This would fetch real-time price data
    # For now, return the latest known price
    current_price
  end

  def update_from_plaid_data(plaid_security_data)
    update!(
      name: plaid_security_data[:name] || name,
      security_type: map_plaid_security_type(plaid_security_data[:type]),
      cusip: plaid_security_data[:cusip] || cusip,
      isin: plaid_security_data[:isin] || isin,
      sedol: plaid_security_data[:sedol] || sedol,
      metadata: metadata.merge(plaid_security_data[:metadata] || {})
    )
  end

  # Search and filtering
  def self.find_or_create_from_plaid(plaid_security_data)
    security = find_by(plaid_security_id: plaid_security_data[:security_id])
    
    if security
      security.update_from_plaid_data(plaid_security_data)
      security
    else
      create!(
        symbol: plaid_security_data[:ticker_symbol] || 'UNKNOWN',
        name: plaid_security_data[:name],
        security_type: map_plaid_security_type(plaid_security_data[:type]),
        plaid_security_id: plaid_security_data[:security_id],
        cusip: plaid_security_data[:cusip],
        isin: plaid_security_data[:isin],
        sedol: plaid_security_data[:sedol],
        currency: plaid_security_data[:iso_currency_code] || 'USD',
        metadata: plaid_security_data[:metadata] || {}
      )
    end
  end

  def self.map_plaid_security_type(plaid_type)
    case plaid_type&.downcase
    when 'equity' then 'stock'
    when 'etf' then 'etf'
    when 'mutual fund' then 'mutual_fund'
    when 'bond' then 'bond'
    when 'option' then 'option'
    when 'warrant' then 'warrant'
    when 'commodity' then 'commodity'
    when 'currency' then 'currency'
    when 'cryptocurrency' then 'cryptocurrency'
    else 'other'
    end
  end

  # Performance analytics
  def performance_summary(period = 1.year)
    start_date = period.ago.to_date
    holdings_in_period = holdings.where('as_of_date >= ?', start_date).order(:as_of_date)
    
    return {} if holdings_in_period.empty?
    
    first_holding = holdings_in_period.first
    last_holding = holdings_in_period.last
    
    {
      period: period,
      start_date: start_date,
      end_date: Date.current,
      start_price: first_holding.current_price_cents,
      end_price: last_holding.current_price_cents,
      price_change_cents: last_holding.current_price_cents - first_holding.current_price_cents,
      price_change_percentage: price_change_from(start_date),
      total_value_change: last_holding.market_value_cents - first_holding.market_value_cents
    }
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :symbol, :name, :security_type, :exchange, :currency, :created_at, :updated_at],
      methods: [
        :display_name, :short_name, :total_holdings_value, :total_quantity_held,
        :current_price, :price_change_1d, :price_change_1w, :price_change_1m
      ]
    ))
  end

  private

  def normalize_symbol
    self.symbol = symbol&.upcase&.strip if symbol.present?
  end

  def set_defaults
    self.currency ||= 'USD'
    self.security_type ||= 'stock'
    self.metadata ||= {}
  end
end
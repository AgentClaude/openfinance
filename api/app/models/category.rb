# Category model for OpenFinance
# Manages transaction categories for budgeting and reporting

class Category < ApplicationRecord
  # Associations
  belongs_to :household, optional: true # System categories don't belong to a household
  has_many :transactions, dependent: :nullify
  has_many :budget_items, dependent: :destroy
  has_many :categorization_rules, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 1, maximum: 100 }
  validates :name, uniqueness: { scope: :household_id, case_sensitive: false }
  validates :icon, length: { maximum: 50 }, allow_blank: true
  validates :color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }, allow_blank: true
  validates :group_name, length: { maximum: 100 }, allow_blank: true

  # Scopes
  scope :system_categories, -> { where(is_system: true) }
  scope :custom_categories, -> { where(is_system: false) }
  scope :income_categories, -> { where(is_income: true) }
  scope :expense_categories, -> { where(is_income: false) }
  scope :by_group, ->(group) { where(group_name: group) }
  scope :ordered, -> { order(:display_order, :name) }

  # Callbacks
  before_validation :set_defaults, on: :create
  before_validation :normalize_name
  before_create :set_display_order

  # System category definitions
  SYSTEM_CATEGORIES = {
    'Food & Drink' => [
      { name: 'Groceries', icon: '🛒', is_income: false },
      { name: 'Restaurants', icon: '🍽️', is_income: false },
      { name: 'Coffee', icon: '☕', is_income: false },
      { name: 'Alcohol & Bars', icon: '🍺', is_income: false }
    ],
    'Shopping' => [
      { name: 'General Merchandise', icon: '🛍️', is_income: false },
      { name: 'Clothing', icon: '👕', is_income: false },
      { name: 'Electronics', icon: '📱', is_income: false },
      { name: 'Home & Garden', icon: '🏠', is_income: false }
    ],
    'Transportation' => [
      { name: 'Gas', icon: '⛽', is_income: false },
      { name: 'Parking', icon: '🅿️', is_income: false },
      { name: 'Public Transportation', icon: '🚌', is_income: false },
      { name: 'Rideshare', icon: '🚗', is_income: false },
      { name: 'Auto & Transport', icon: '🔧', is_income: false }
    ],
    'Bills & Utilities' => [
      { name: 'Phone', icon: '📞', is_income: false },
      { name: 'Internet', icon: '🌐', is_income: false },
      { name: 'Electric', icon: '⚡', is_income: false },
      { name: 'Gas & Heating', icon: '🔥', is_income: false },
      { name: 'Water', icon: '💧', is_income: false },
      { name: 'Trash', icon: '🗑️', is_income: false },
      { name: 'Rent', icon: '🏠', is_income: false },
      { name: 'Mortgage', icon: '🏠', is_income: false }
    ],
    'Entertainment' => [
      { name: 'Movies & TV', icon: '🎬', is_income: false },
      { name: 'Music', icon: '🎵', is_income: false },
      { name: 'Games', icon: '🎮', is_income: false },
      { name: 'Sports', icon: '⚽', is_income: false },
      { name: 'Arts', icon: '🎨', is_income: false }
    ],
    'Personal Care' => [
      { name: 'Haircut', icon: '✂️', is_income: false },
      { name: 'Spa & Massage', icon: '💆', is_income: false },
      { name: 'Pharmacy', icon: '💊', is_income: false },
      { name: 'Personal Care', icon: '🧴', is_income: false }
    ],
    'Healthcare' => [
      { name: 'Doctor', icon: '👨‍⚕️', is_income: false },
      { name: 'Dentist', icon: '🦷', is_income: false },
      { name: 'Eye Care', icon: '👁️', is_income: false },
      { name: 'Pharmacy', icon: '💊', is_income: false },
      { name: 'Health Insurance', icon: '🏥', is_income: false }
    ],
    'Financial' => [
      { name: 'Bank Fees', icon: '🏦', is_income: false },
      { name: 'ATM Fees', icon: '🏧', is_income: false },
      { name: 'Interest Charges', icon: '💳', is_income: false },
      { name: 'Investments', icon: '📈', is_income: false },
      { name: 'Insurance', icon: '🛡️', is_income: false }
    ],
    'Income' => [
      { name: 'Salary', icon: '💰', is_income: true },
      { name: 'Freelance', icon: '💻', is_income: true },
      { name: 'Investment Income', icon: '📈', is_income: true },
      { name: 'Interest Income', icon: '🏦', is_income: true },
      { name: 'Rental Income', icon: '🏠', is_income: true },
      { name: 'Other Income', icon: '💵', is_income: true }
    ],
    'Transfer' => [
    ]
  }.freeze

  # Category groups for organization
  def self.category_groups
    SYSTEM_CATEGORIES.keys + custom_groups
  end

  def self.custom_groups
    where(is_system: false)
      .where.not(group_name: [nil, ''])
      .distinct
      .pluck(:group_name)
      .sort
  end

  # Create system categories for a household
  def self.create_system_categories_for_household(household)
    SYSTEM_CATEGORIES.each do |group_name, categories|
      categories.each_with_index do |category_data, index|
        create!(
          household: household,
          name: category_data[:name],
          group_name: group_name,
          icon: category_data[:icon],
          is_income: category_data[:is_income] || false,
          is_system: true,
          display_order: index,
          color: generate_color(category_data[:name])
        )
      end
    end
  end

  # Generate a consistent color for a category
  def self.generate_color(name)
    colors = %w[
      #FF6B6B #4ECDC4 #45B7D1 #FFA07A #98D8C8 #F7DC6F #BB8FCE #85C1E9
      #F8C471 #82E0AA #F1948A #AED6F1 #A9DFBF #F9E79F #D7DBDD #FADBD8
    ]
    
    colors[name.sum % colors.length]
  end

  # Instance methods
  def display_name
    name
  end

  def display_color
    color.presence || self.class.generate_color(name)
  end

  def display_icon
    icon.presence || default_icon
  end

  def transaction_count
    transactions.count
  end

  def monthly_spending(date = Date.current)
    start_date = date.beginning_of_month
    end_date = date.end_of_month
    
    amount_cents = transactions
      .where(date: start_date..end_date)
      .sum(:amount_cents)
    
    result = Money.new(amount_cents)
    is_income? ? result : result.abs
  end

  def average_transaction_amount
    return Money.new(0) if transaction_count.zero?
    
    total_cents = transactions.sum(:amount_cents)
    Money.new(total_cents / transaction_count)
  end

  def can_be_deleted?
    !is_system? && transaction_count.zero?
  end

  def merge_into!(target_category)
    return false if target_category == self
    return false if is_system? && target_category.household_id != household_id
    
    ActiveRecord::Base.transaction do
      # Move all transactions
      transactions.update_all(category_id: target_category.id)
      
      # Move budget items
      budget_items.update_all(category_id: target_category.id)
      
      # Move categorization rules
      categorization_rules.update_all(category_id: target_category.id)
      
      # Delete this category
      destroy!
    end
    
    true
  end

  # Search functionality
  def self.search(query, household_id = nil)
    scope = all
    scope = scope.where(household_id: household_id) if household_id
    
    return scope if query.blank?
    
    scope.where('name ILIKE ? OR group_name ILIKE ?', "%#{query}%", "%#{query}%")
  end

  # Budget helpers
  def budgeted_amount(month = Date.current.beginning_of_month)
    budget_item = budget_items.find_by(month: month)
    budget_item&.amount || 0
  end

  def budget_variance(month = Date.current.beginning_of_month)
    budgeted = budgeted_amount(month)
    actual = monthly_spending(month.to_date)
    
    if is_income?
      actual - budgeted # For income, positive variance is good
    else
      budgeted - actual # For expenses, positive variance is good (under budget)
    end
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [
        :display_name, :display_color, :display_icon, :transaction_count,
        :can_be_deleted?
      ]
    ))
  end

  private

  def set_defaults
    self.is_income ||= false
    self.is_system ||= false
    self.color_hex ||= self.class.generate_color(name)
  end

  def normalize_name
    self.name = name.to_s.strip.titleize if name.present?
  end

  def set_display_order
    return if display_order.present?
    
    scope = household_id ? household.categories : self.class.system_categories
    max_order = scope.where(group_name: group_name).maximum(:display_order) || 0
    self.display_order = max_order + 1
  end

  def default_icon
    case group_name&.downcase
    when 'food & drink', 'food'
      '🍽️'
    when 'shopping'
      '🛍️'
    when 'transportation', 'transport'
      '🚗'
    when 'bills', 'utilities'
      '📄'
    when 'entertainment'
      '🎬'
    when 'healthcare', 'health'
      '🏥'
    when 'income'
      '💰'
    when 'transfer'
      '↔️'
    else
      '📊'
    end
  end
end
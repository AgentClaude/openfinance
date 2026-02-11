# Transaction model for OpenFinance
# Represents individual financial transactions (thin model - business logic in services)

class Transaction < ApplicationRecord

  # Associations
  belongs_to :household
  belongs_to :account
  belongs_to :category, optional: true
  belongs_to :reviewed_by, class_name: 'User', optional: true
  has_many :transaction_tags, dependent: :destroy
  has_many :tags, through: :transaction_tags

  # Money attributes
  monetize :amount_cents

  # Validations
  validates :household, presence: true
  validates :account, presence: true
  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :merchant_name, length: { maximum: 255 }, allow_blank: true
  # validates :description, length: { maximum: 1000 }, allow_blank: true
  validates :notes, length: { maximum: 2000 }, allow_blank: true
  validates :plaid_transaction_id, uniqueness: { scope: :account_id }, allow_blank: true
  
  validate :household_matches_account

  # Enums removed - currency is now just a string field

  # Scopes
  scope :income, -> { where('amount > 0') }
  scope :expenses, -> { where('amount < 0') }
  scope :pending, -> { where(is_pending: true) }
  scope :posted, -> { where(is_pending: false) }
  scope :needs_review, -> { where(needs_review: true) }
  scope :reviewed, -> { where(needs_review: false) }
  scope :this_month, -> { where(date: Date.current.beginning_of_month..Date.current.end_of_month) }
  scope :last_month, -> { where(date: 1.month.ago.beginning_of_month..1.month.ago.end_of_month) }
  scope :by_account, ->(account) { where(account: account) }
  scope :by_category, ->(category) { where(category: category) }
  scope :by_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }
  scope :search_text, ->(query) { where("name ILIKE ? OR merchant_name ILIKE ?", "%#{query}%", "%#{query}%") }
  scope :ordered, -> { order(date: :desc, created_at: :desc) }

  # Callbacks
  before_validation :set_currency_from_account
  before_save :normalize_merchant_name

  # Type helpers
  def income?
    amount > 0
  end

  def expense?
    amount < 0
  end

  def transfer?
    false
  end

  # Display methods
  def display_amount
    amount.abs
  end

  def display_merchant_name
    merchant_name.presence || 'Unknown'
  end

  def display_description
    merchant_name.presence || 'Transaction'
  end

  # Split transaction helpers
  def split_transaction?
  end

  def parent_transaction?
  end

  def can_be_split?
  end

  # Tag helpers
  def tag_names
    tags.pluck(:name)
  end

  # Status helpers
  def categorized?
    category.present?
  end

  def uncategorized?
    category.blank?
  end

  private

  def set_currency_from_account
    self.currency ||= account&.currency || 'USD'
  end

  def normalize_merchant_name
    return unless merchant_name.present?
    self.merchant_name = merchant_name.strip
  end

  def household_matches_account
    if account && household && account.household_id != household_id
      errors.add(:household, "must match account's household")
    end
  end
end
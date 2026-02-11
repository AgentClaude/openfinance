class Tag < ApplicationRecord

  # Associations
  belongs_to :household
  has_many :transaction_tags, dependent: :destroy
  has_many :transactions, through: :transaction_tags

  # Validations
  validates :name, presence: true, length: { minimum: 1, maximum: 50 }
  validates :name, uniqueness: { scope: :household_id, case_sensitive: false }
  validates :color_hex, format: { with: /\A#[0-9A-Fa-f]{6}\z/, message: 'must be a valid hex color' }

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :by_name, ->(name) { where(name: name) }
  scope :used, -> { joins(:transactions).distinct }
  scope :unused, -> { left_joins(:transactions).where(transactions: { id: nil }) }

  # Callbacks
  before_validation :normalize_name
  before_validation :set_default_color

  # Instance methods
  def transactions_count
    transactions.count
  end

  def recent_transactions(limit = 10)
    transactions.includes(:account, :category)
               .order(date: :desc, created_at: :desc)
               .limit(limit)
  end

  def usage_summary(start_date = 1.month.ago, end_date = Date.current)
    tagged_transactions = transactions.where(date: start_date..end_date)
    
    {
      transaction_count: tagged_transactions.count,
      total_amount: tagged_transactions.sum(:amount_cents),
      avg_amount: tagged_transactions.average(:amount_cents)&.round(2) || 0,
      date_range: {
        start_date: start_date,
        end_date: end_date
      }
    }
  end

  def similar_tags
    household.tags.where.not(id: id)
             .where("name ILIKE ?", "%#{name.gsub(/[%_]/, '')}%")
             .limit(5)
  end

  # Display methods
  def display_name
    name.titleize
  end

  def to_s
    name
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :name, :description, :color_hex, :is_active, :created_at, :updated_at],
      methods: [:display_name, :transactions_count]
    ))
  end

  private

  def normalize_name
    self.name = name&.strip&.downcase
  end

  def set_default_color
    self.color_hex = generate_color_from_name if color_hex.blank?
  end

  def generate_color_from_name
    # Generate a consistent color based on the tag name
    colors = %w[#EF4444 #F97316 #F59E0B #EAB308 #84CC16 #22C55E #10B981 #14B8A6 #06B6D4 #0EA5E9 #3B82F6 #6366F1 #8B5CF6 #A855F7 #D946EF #EC4899 #F43F5E]
    hash = name.to_s.sum % colors.length
    colors[hash]
  end
end
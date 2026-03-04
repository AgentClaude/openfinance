# Household model for OpenFinance
# Represents a family or group sharing financial data

class Household < ApplicationRecord
  # Associations
  has_many :users, dependent: :destroy
  has_many :household_memberships, dependent: :destroy
  has_many :member_users, through: :household_memberships, source: :user
  has_many :account_connections, dependent: :destroy
  has_many :accounts, dependent: :destroy
  has_many :transactions, dependent: :destroy
  has_many :categories, dependent: :destroy
  has_many :budgets, dependent: :destroy
  has_many :goals, dependent: :destroy
  has_many :recurring_items, dependent: :destroy
  has_many :categorization_rules, dependent: :destroy
  has_many :tags, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :activity_events, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }

  # Scopes
  scope :active, -> { joins(:users).where(users: { locked_at: nil }).distinct }
  scope :with_transactions, -> { joins(:transactions).distinct }

  # Callbacks
  after_create :create_default_categories
  after_create :create_default_budget

  # Financial calculations
  def total_assets
    accounts.assets.sum(:current_balance) || 0
  end

  def total_liabilities
    accounts.liabilities.sum(:current_balance).abs || 0
  end

  def net_worth
    total_assets - total_liabilities
  end

  def monthly_income(date = Date.current)
    start_date = date.beginning_of_month
    end_date = date.end_of_month
    
    transactions.income
                .where(date: start_date..end_date)
                .sum(:amount) || 0
  end

  def monthly_expenses(date = Date.current)
    start_date = date.beginning_of_month
    end_date = date.end_of_month
    
    transactions.expenses
                .where(date: start_date..end_date)
                .sum(:amount).abs || 0
  end

  def monthly_cash_flow(date = Date.current)
    monthly_income(date) - monthly_expenses(date)
  end

  # Account management
  def connected_accounts
    accounts.where.not(connection_id: nil)
  end

  def manual_accounts
    accounts.where(connection_id: nil)
  end

  def account_types_summary
    accounts.group(:account_type).sum(:current_balance)
  end

  # Transaction management
  def transactions_needing_review
    transactions.where(needs_review: true)
  end

  def recent_transactions(limit = 20)
    transactions.includes(:account, :category)
                .order(date: :desc, created_at: :desc)
                .limit(limit)
  end

  def transactions_by_category(start_date = 1.month.ago, end_date = Date.current)
    transactions.joins(:category)
                .where(date: start_date..end_date)
                .group('categories.name')
                .sum(:amount)
  end

  # Member management
  def owners
    users.where(role: 'owner')
  end

  def members
    users.where(role: 'member')
  end

  def advisors
    users.where(role: 'advisor')
  end

  def all_members
    User.where(id: user_ids + household_memberships.pluck(:user_id))
  end

  def add_member(user, role = 'member')
    return false if member?(user)
    
    if user.household_id.present? && user.household_id != id
      # Create membership for user who belongs to another household
      household_memberships.create!(user: user, role: role)
    else
      # Direct assignment for users without a household
      user.update!(household: self, role: role)
    end
  end

  def remove_member(user)
    if user.household_id == id
      # Primary household member
      if owners.count > 1 || user.role != 'owner'
        user.update!(household: nil, role: 'member')
      else
        return false # Can't remove the last owner
      end
    else
      # Secondary household member
      household_memberships.where(user: user).destroy_all
    end
    
    true
  end

  def member?(user)
    user.household_id == id || household_memberships.exists?(user: user)
  end

  def owner?(user)
    user.household_id == id && user.role == 'owner'
  end

  # Category management
  def default_categories
    categories.where(is_system: true)
  end

  def custom_categories
    categories.where(is_system: false)
  end

  def income_categories
    categories.where(is_income: true)
  end

  def expense_categories
    categories.where(is_income: false)
  end

  # Budget management
  def current_budget
    budgets.where(is_active: true).first || budgets.first
  end

  def budget_performance(month = Date.current.beginning_of_month)
    return {} unless current_budget
    
    budget_items = current_budget.budget_items.where(month: month)
    performance = {}
    
    budget_items.each do |item|
      spent = transactions.where(
        category: item.category,
        date: month..month.end_of_month
      ).sum(:amount).abs
      
      performance[item.category.name] = {
        budgeted: item.amount,
        spent: spent,
        remaining: item.amount - spent,
        percentage: item.amount > 0 ? (spent / item.amount * 100).round(1) : 0
      }
    end
    
    performance
  end

  # Dashboard data
  def dashboard_summary(period = 30.days)
    end_date = Date.current
    start_date = end_date - period
    
    {
      net_worth: net_worth,
      monthly_income: monthly_income,
      monthly_expenses: monthly_expenses,
      cash_flow: monthly_cash_flow,
      account_count: accounts.count,
      transaction_count: transactions.where(date: start_date..end_date).count,
      pending_transactions: transactions.where(is_pending: true).count,
      needs_review_count: transactions_needing_review.count,
      top_categories: transactions_by_category(start_date, end_date)
                       .sort_by { |_, amount| -amount.abs }
                       .first(5)
                       .to_h
    }
  end

  # Search functionality
  def search_transactions(query)
    return transactions.none if query.blank?
    
    transactions.joins(:account, :category)
                .where(
                  "transactions.name ILIKE ? OR " \
                  "transactions.merchant_name ILIKE ? OR " \
                  "transactions.notes ILIKE ? OR " \
                  "accounts.name ILIKE ? OR " \
                  "categories.name ILIKE ?",
                  *Array.new(5, "%#{query}%")
                )
  end

  private

  def create_default_categories
    CreateDefaultCategoriesJob.safe_perform_later(self)
  end

  def create_default_budget
    CreateDefaultBudgetJob.safe_perform_later(self)
  end
end
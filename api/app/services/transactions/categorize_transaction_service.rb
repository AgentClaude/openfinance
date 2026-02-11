# Service for categorizing transactions
# Handles both manual categorization and auto-categorization via rules

class Transactions::CategorizeTransactionService < ApplicationService
  attr_accessor :transaction, :category_id, :current_user, :create_rule

  validates :transaction, presence: true
  validate :category_belongs_to_household
  validate :user_can_edit_transaction

  def call
    return validation_failure(self) unless valid?

    old_category = transaction.category

    ActiveRecord::Base.transaction do
      update_transaction_category!
      create_categorization_rule! if create_rule && category_changed?
      mark_as_reviewed!
    end

    success(
      transaction: transaction.reload,
      category_changed: category_changed?(old_category),
      rule_created: @rule_created
    )
  rescue StandardError => e
    Rails.logger.error "Failed to categorize transaction: #{e.message}"
    failure(['Failed to categorize transaction'])
  end

  private

  def initialize(transaction:, category_id:, current_user:, create_rule: false)
    @transaction = transaction
    @category_id = category_id
    @current_user = current_user
    @create_rule = create_rule == true || create_rule == 'true'
    @rule_created = false
  end

  def category_belongs_to_household
    return unless category_id.present?
    
    category = Category.find_by(id: category_id)
    return errors.add(:category_id, 'not found') unless category

    unless category.household_id == transaction.household_id || category.is_system?
      errors.add(:category_id, 'does not belong to transaction household')
    end

    @category = category
  end

  def user_can_edit_transaction
    return unless current_user && transaction

    unless current_user.can_access_household?(transaction.household) && !current_user.advisor?
      errors.add(:base, 'You do not have permission to edit this transaction')
    end
  end

  def update_transaction_category!
    transaction.update!(
      category_id: category_id,
      updated_at: Time.current
    )
  end

  def create_categorization_rule!
    return unless @category && transaction.merchant_name.present?
    return if rule_exists?

    rule = transaction.household.categorization_rules.create!(
      category: @category,
      match_field: 'merchant_name',
      match_type: 'contains',
      match_value: transaction.merchant_name,
      priority: 0,
      is_active: true
    )

    @rule_created = true
    
    # Apply this rule to other uncategorized transactions
    ApplyCategorizationRulesJob.perform_later(transaction.household, rule.id)
  end

  def mark_as_reviewed!
    if transaction.needs_review?
      transaction.update!(
        needs_review: false,
        reviewed_by: current_user,
        reviewed_at: Time.current
      )
    end
  end

  def category_changed?(old_category = nil)
    old_category ||= transaction.category_was
    old_category&.id != category_id&.to_i
  end

  def rule_exists?
    transaction.household
              .categorization_rules
              .where(
                match_field: 'merchant_name',
                match_type: 'contains',
                match_value: transaction.merchant_name
              )
              .exists?
  end
end
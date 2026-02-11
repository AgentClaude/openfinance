class Transactions::AutoCategorizeService < ApplicationService
  attr_accessor :transaction

  validates :transaction, presence: true

  def call
    return validation_failure(self) unless valid?

    begin
      # Try categorization rules first
      category = apply_categorization_rules
      
      # Fall back to merchant-based categorization
      category ||= categorize_by_merchant_name
      
      # Fall back to amount-based patterns
      category ||= categorize_by_amount_pattern
      
      # Fall back to description keywords
      category ||= categorize_by_description_keywords
      
      if category
        success(category: category, method: determine_categorization_method(category))
      else
        failure("Unable to auto-categorize transaction")
      end
    rescue StandardError => e
      Rails.logger.error "AutoCategorizeService failed: #{e.message}"
      failure("Auto-categorization error: #{e.message}")
    end
  end

  private

  def apply_categorization_rules
    household = transaction.household
    rules = household.categorization_rules
                     .active
                     .order(priority: :desc, created_at: :asc)

    rules.each do |rule|
      next unless rule_matches?(rule)
      
      rule.increment!(:matches_count)
      return rule.category
    end
    
    nil
  end

  def rule_matches?(rule)
    conditions = rule.conditions

    case rule.rule_type
    when 'merchant_name'
      match_merchant_rule(conditions)
    when 'amount_range'
      match_amount_range_rule(conditions)
    when 'description_contains'
      match_description_rule(conditions)
    when 'account_type'
      match_account_type_rule(conditions)
    else
      false
    end
  end

  def match_merchant_rule(conditions)
    merchant_patterns = conditions['merchant_patterns'] || []
    return false if merchant_patterns.empty? || transaction.merchant_name.blank?

    merchant_patterns.any? do |pattern|
      transaction.merchant_name.downcase.include?(pattern.downcase)
    end
  end

  def match_amount_range_rule(conditions)
    min_amount = conditions['min_amount_cents']
    max_amount = conditions['max_amount_cents']
    amount = transaction.amount_cents.abs

    (min_amount.nil? || amount >= min_amount) &&
    (max_amount.nil? || amount <= max_amount)
  end

  def match_description_rule(conditions)
    keywords = conditions['keywords'] || []
    return false if keywords.empty?

    search_text = "#{transaction.name} #{transaction.merchant_name}".downcase

    keywords.any? do |keyword|
      search_text.include?(keyword.downcase)
    end
  end

  def match_account_type_rule(conditions)
    account_types = conditions['account_types'] || []
    account_types.include?(transaction.account.account_type)
  end

  def categorize_by_merchant_name
    return nil if transaction.merchant_name.blank?

    # Look for similar transactions with the same merchant
    similar_transactions = transaction.household.transactions
                                     .where.not(id: transaction.id)
                                     .where.not(category_id: nil)
                                     .where('merchant_name ILIKE ?', "%#{transaction.merchant_name}%")
                                     .limit(10)

    return nil if similar_transactions.empty?

    # Return the most commonly used category for this merchant
    category_counts = similar_transactions.group(:category_id).count
    most_common_category_id = category_counts.max_by { |_, count| count }&.first
    
    Category.find_by(id: most_common_category_id)
  end

  def categorize_by_amount_pattern
    amount = transaction.amount_cents.abs
    account_type = transaction.account.account_type

    # Common amount patterns
    case amount
    when 0..500_00 # Under $5
      find_category_by_patterns(['Coffee', 'Snacks', 'Small Purchases'])
    when 500_00..2000_00 # $5-20
      if account_type == 'credit'
        find_category_by_patterns(['Dining', 'Entertainment', 'Personal Care'])
      else
        find_category_by_patterns(['Food', 'Transportation'])
      end
    when 2000_00..10000_00 # $20-100
      find_category_by_patterns(['Groceries', 'Gas', 'Utilities', 'Shopping'])
    when 10000_00..50000_00 # $100-500
      find_category_by_patterns(['Shopping', 'Home', 'Healthcare'])
    when 50000_00..150000_00 # $500-1500
      find_category_by_patterns(['Rent', 'Mortgage', 'Insurance', 'Major Purchase'])
    else # Over $1500
      find_category_by_patterns(['Income', 'Transfer', 'Investment', 'Major Expense'])
    end
  end

  def categorize_by_description_keywords
    description = "#{transaction.name} #{transaction.merchant_name}".downcase

    keyword_mappings = {
      'groceries' => ['grocery', 'supermarket', 'food', 'market', 'trader joe', 'whole foods', 'safeway'],
      'gas' => ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp', 'mobil'],
      'dining' => ['restaurant', 'cafe', 'pizza', 'burger', 'coffee', 'starbucks', 'mcdonald'],
      'entertainment' => ['movie', 'theater', 'netflix', 'spotify', 'game', 'entertainment'],
      'shopping' => ['amazon', 'target', 'walmart', 'store', 'shop', 'retail'],
      'transportation' => ['uber', 'lyft', 'taxi', 'bus', 'train', 'parking', 'toll'],
      'utilities' => ['electric', 'water', 'internet', 'cable', 'phone', 'utility'],
      'healthcare' => ['medical', 'doctor', 'pharmacy', 'hospital', 'dental', 'health'],
      'income' => ['payroll', 'salary', 'deposit', 'income', 'wage', 'bonus'],
      'transfer' => ['transfer', 'payment', 'venmo', 'paypal', 'zelle'],
      'home' => ['home depot', 'lowes', 'furniture', 'repair', 'maintenance']
    }

    keyword_mappings.each do |category_name, keywords|
      if keywords.any? { |keyword| description.include?(keyword) }
        return find_category_by_name(category_name)
      end
    end

    nil
  end

  def find_category_by_patterns(pattern_names)
    household = transaction.household
    
    pattern_names.each do |pattern|
      category = household.categories.where('name ILIKE ?', "%#{pattern}%").first
      return category if category
    end
    
    nil
  end

  def find_category_by_name(name)
    household = transaction.household
    household.categories.where('name ILIKE ?', "%#{name}%").first
  end

  def determine_categorization_method(category)
    # This helps with analytics and rule learning
    if category.nil?
      'none'
    else
      'auto_rules' # Could be enhanced to track specific method used
    end
  end
end
# Analyzes manual categorization patterns to suggest new rules.
# Looks for merchants that have been consistently categorized the same way
# but don't have an existing rule covering them.
class SuggestCategorizationRules
  MIN_TRANSACTIONS = 2  # Minimum transactions to suggest a rule
  MIN_CONFIDENCE = 0.75 # 75% of transactions must share the same category

  def initialize(household)
    @household = household
  end

  def call
    existing_rules = @household.categorization_rules.active.to_a
    suggestions = []

    # Group transactions by merchant_name, find consistent categorization patterns
    categorized_transactions = @household.transactions
      .where.not(category_id: nil)
      .where.not(merchant_name: [nil, ''])
      .where(needs_review: false)
      .select(:merchant_name, :category_id)

    grouped = categorized_transactions.group_by { |t| t.merchant_name.downcase.strip }

    grouped.each do |merchant_key, txns|
      next if txns.size < MIN_TRANSACTIONS

      # Count categories for this merchant
      category_counts = txns.group_by(&:category_id).transform_values(&:size)
      total = txns.size
      top_category_id, top_count = category_counts.max_by { |_, count| count }

      confidence = top_count.to_f / total
      next if confidence < MIN_CONFIDENCE

      # Check if an existing rule already covers this merchant
      sample_merchant = txns.first.merchant_name
      already_covered = existing_rules.any? do |rule|
        rule.match_field == 'merchant_name' &&
          fake_txn_matches?(rule, sample_merchant)
      end
      next if already_covered

      suggestions << {
        merchant_name: sample_merchant,
        category_id: top_category_id,
        transaction_count: total,
        confidence: (confidence * 100).round(1),
        match_field: 'merchant_name',
        match_type: 'exact',
        match_value: sample_merchant
      }
    end

    # Sort by transaction count (most impactful first), limit to 20
    suggestions.sort_by { |s| -s[:transaction_count] }.first(20)
  end

  private

  def fake_txn_matches?(rule, merchant_name)
    field_value = merchant_name.to_s
    case rule.match_type
    when 'contains'
      field_value.downcase.include?(rule.match_value.downcase)
    when 'exact'
      field_value.downcase == rule.match_value.downcase
    when 'starts_with'
      field_value.downcase.start_with?(rule.match_value.downcase)
    when 'ends_with'
      field_value.downcase.end_with?(rule.match_value.downcase)
    else
      false
    end
  end
end

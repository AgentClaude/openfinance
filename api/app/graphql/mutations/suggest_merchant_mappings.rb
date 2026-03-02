module Mutations
  class SuggestMerchantMappings < BaseMutation
    field :suggestions, [Types::MerchantSuggestionType], null: false

    def resolve
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      existing_patterns = household.merchant_mappings.pluck(:raw_pattern).map(&:downcase)

      # Find transactions with ugly names that could be cleaned up
      # Group by merchant_name, find ones that look like raw bank descriptions
      suggestions = household.transactions
        .where.not(name: [nil, ""])
        .group(:name)
        .having("COUNT(*) >= 2")
        .order("COUNT(*) DESC")
        .limit(20)
        .pluck(:name, Arel.sql("COUNT(*)"))
        .filter_map do |name, count|
          next if name.length < 5
          next if existing_patterns.any? { |p| name.downcase.include?(p) }
          # Suggest cleaning if name has common raw patterns
          clean = clean_merchant_name(name)
          next if clean == name # Already clean
          { raw_pattern: name, suggested_name: clean, transaction_count: count }
        end

      { suggestions: suggestions }
    end

    private

    def clean_merchant_name(raw)
      name = raw.dup
      # Remove trailing reference numbers (e.g., "STARBUCKS #12345")
      name = name.sub(/\s*#\d+\s*$/, '')
      # Remove trailing dates (e.g., "AMAZON 02/15")
      name = name.sub(/\s*\d{2}\/\d{2}\s*$/, '')
      # Remove city/state suffixes (e.g., "TARGET SALT LAKE CI UT")
      name = name.sub(/\s+[A-Z]{2}\s*$/, '') if name.match?(/\s+[A-Z]{2}\s*$/)
      # Remove extra whitespace
      name = name.strip.squeeze(' ')
      # Title case
      name = name.split(/\s+/).map(&:capitalize).join(' ')
      name
    end
  end
end

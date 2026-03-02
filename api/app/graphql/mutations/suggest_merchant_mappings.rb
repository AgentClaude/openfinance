module Mutations
  class SuggestMerchantMappings < BaseMutation
    class MerchantSuggestionType < Types::BaseObject
      field :raw_pattern, String, null: false
      field :suggested_name, String, null: false
      field :transaction_count, Integer, null: false
    end

    field :suggestions, [MerchantSuggestionType], null: false

    def resolve
      hh = require_auth!
      existing_patterns = hh.merchant_mappings.pluck(:raw_pattern).map(&:downcase)

      # Find messy merchant names that appear frequently
      merchant_groups = hh.transactions
        .where.not(merchant_name: [nil, ""])
        .group(:merchant_name)
        .having("COUNT(*) >= 2")
        .order("COUNT(*) DESC")
        .limit(50)
        .pluck(:merchant_name, Arel.sql("COUNT(*)"))

      suggestions = []
      merchant_groups.each do |raw_name, count|
        # Skip if already mapped
        next if existing_patterns.any? { |p| raw_name.downcase.include?(p) }

        # Generate clean name suggestion by removing common junk patterns
        clean = clean_merchant_name(raw_name)
        next if clean == raw_name # No improvement to suggest

        suggestions << {
          raw_pattern: raw_name,
          suggested_name: clean,
          transaction_count: count
        }
      end

      { suggestions: suggestions.first(20) }
    end

    private

    def clean_merchant_name(raw)
      name = raw.dup
      # Remove common suffixes/patterns from bank descriptions
      name = name.gsub(/\s*#\d+\s*$/, '')           # Trailing #12345
      name = name.gsub(/\s*\*[\w\d]+\s*$/, '')      # Trailing *ABC123
      name = name.gsub(/\s+\d{3,}[-\d]*\s*$/, '')   # Trailing long numbers
      name = name.gsub(/\s+(US|CA|GB|AU|NZ)\s*$/i, '') # Country codes
      name = name.gsub(/\s+\d{5}(-\d{4})?\s*$/, '') # ZIP codes
      name = name.gsub(/\bSQ\s*\*\s*/i, '')         # Square prefix
      name = name.gsub(/\bTST\s*\*\s*/i, '')        # Toast prefix
      name = name.gsub(/\bPOS\s+(DEBIT\s+)?/i, '')  # POS prefix
      name = name.gsub(/\bACH\s+(DEBIT\s+)?/i, '')  # ACH prefix
      name = name.gsub(/\s{2,}/, ' ')               # Multiple spaces
      name.strip.titleize
    end
  end
end

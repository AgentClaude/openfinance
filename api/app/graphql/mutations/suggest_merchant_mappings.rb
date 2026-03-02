module Mutations
  class SuggestMerchantMappings < BaseMutation
    class SuggestionType < Types::BaseObject
      field :raw_pattern, String, null: false
      field :suggested_name, String, null: false
      field :transaction_count, Integer, null: false
    end

    field :suggestions, [SuggestionType], null: false

    def resolve
      hh = require_auth!

      # Group transactions by raw merchant_name, find messy patterns
      merchant_groups = hh.transactions
        .where.not(merchant_name: [nil, ''])
        .group(:merchant_name)
        .count
        .sort_by { |_, count| -count }

      # Find merchants that look like they need cleaning
      # (contain digits, extra spaces, all caps, common junk patterns)
      suggestions = []
      seen_clean = Set.new

      merchant_groups.each do |raw_name, count|
        next if count < 2

        clean = clean_merchant_name(raw_name)
        next if clean == raw_name # already clean
        next if seen_clean.include?(clean.downcase)

        seen_clean.add(clean.downcase)
        suggestions << {
          raw_pattern: raw_name,
          suggested_name: clean,
          transaction_count: count
        }

        break if suggestions.size >= 20
      end

      { suggestions: suggestions }
    end

    private

    def clean_merchant_name(name)
      clean = name.dup

      # Remove trailing transaction IDs, reference numbers
      clean.gsub!(/\s*#\d+\s*$/, '')
      clean.gsub!(/\s*\d{4,}\s*$/, '')

      # Remove common suffixes like "LLC", "INC", "CORP"
      clean.gsub!(/\s+(LLC|INC|CORP|LTD|CO)\s*\.?\s*$/i, '')

      # Remove city/state patterns at end (e.g., "STORE NAME CITY ST")
      clean.gsub!(/\s+[A-Z]{2}\s*\d{5}(-\d{4})?\s*$/, '')

      # Remove extra whitespace
      clean = clean.strip.gsub(/\s+/, ' ')

      # Title case if all caps
      if clean == clean.upcase && clean.length > 3
        clean = clean.split(' ').map(&:capitalize).join(' ')
      end

      clean
    end
  end
end

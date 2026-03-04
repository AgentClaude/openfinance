# frozen_string_literal: true

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

      # Find messy merchant names that could be cleaned up
      # Group by similar patterns and suggest clean names
      existing_patterns = hh.merchant_mappings.pluck(:raw_pattern).map(&:downcase)

      raw_names = hh.transactions
                     .where.not(merchant_name: [nil, ''])
                     .group(:merchant_name)
                     .having('COUNT(*) >= 2')
                     .order('COUNT(*) DESC')
                     .limit(20)
                     .count

      suggestions = raw_names.filter_map do |name, count|
        # Skip if already mapped
        next if existing_patterns.any? { |p| name.downcase.include?(p) }
        # Suggest a cleaned-up version
        clean = name.gsub(/\s*(#\d+|SQ\s*\*|TST\s*\*|\*\d+).*$/i, '')
                    .gsub(/\s{2,}/, ' ')
                    .strip
                    .split.map(&:capitalize).join(' ')

        next if clean == name # Already clean

        { raw_pattern: name, suggested_name: clean, transaction_count: count }
      end

      { suggestions: suggestions }
    end
  end
end

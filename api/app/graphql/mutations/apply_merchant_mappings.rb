# frozen_string_literal: true

module Mutations
  class ApplyMerchantMappings < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      hh = require_auth!
      mappings = hh.merchant_mappings.active
      updated = 0

      mappings.find_each do |mapping|
        pattern = mapping.raw_pattern.downcase
        scope = hh.transactions.where.not(merchant_name: [nil, ''])
        scope = case mapping.match_type
                when 'exact'
                  scope.where('LOWER(merchant_name) = :p OR LOWER(name) = :p', p: pattern)
                when 'starts_with'
                  scope.where('LOWER(merchant_name) LIKE :p OR LOWER(name) LIKE :p', p: "#{sanitize_like(pattern)}%")
                else # contains
                  scope.where('LOWER(merchant_name) LIKE :p OR LOWER(name) LIKE :p', p: "%#{sanitize_like(pattern)}%")
                end
        scope = scope.where.not(merchant_name: mapping.clean_name)
        count = scope.update_all(merchant_name: mapping.clean_name)
        updated += count
        mapping.update!(applied_count: (mapping.applied_count || 0) + count) if count > 0
      end

      { updated_count: updated }
    end

    private

    def sanitize_like(str)
      str.gsub(/[%_\\]/) { |m| "\\#{m}" }
    end
  end
end

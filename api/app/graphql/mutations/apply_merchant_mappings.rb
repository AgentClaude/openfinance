# frozen_string_literal: true

module Mutations
  class ApplyMerchantMappings < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      hh = require_auth!
      mappings = hh.merchant_mappings.active
      updated = 0

      mappings.find_each do |mapping|
        txns = hh.transactions.where.not(merchant_name: [nil, ''])
        matched = txns.select { |t| mapping.matches?(t.merchant_name || t.name) }
        matched.each do |txn|
          next if txn.merchant_name == mapping.clean_name

          txn.update!(merchant_name: mapping.clean_name)
          updated += 1
        end
        mapping.update!(applied_count: (mapping.applied_count || 0) + matched.size) if matched.any?
      end

      { updated_count: updated }
    end
  end
end

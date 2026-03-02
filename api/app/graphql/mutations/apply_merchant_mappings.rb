module Mutations
  class ApplyMerchantMappings < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      hh = require_auth!
      mappings = hh.merchant_mappings.active.to_a
      return { updated_count: 0 } if mappings.empty?

      updated = 0
      hh.transactions.find_each do |txn|
        source = txn.raw_description.presence || txn.merchant_name
        next if source.blank?

        mapping = mappings.find { |m| m.matches?(source) }
        next unless mapping
        next if txn.merchant_name == mapping.clean_name

        txn.update_columns(
          merchant_name: mapping.clean_name,
          raw_description: txn.raw_description.presence || txn.merchant_name
        )
        mapping.increment!(:applied_count)
        updated += 1
      end

      { updated_count: updated }
    end
  end
end

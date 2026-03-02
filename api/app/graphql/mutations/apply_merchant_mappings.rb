module Mutations
  class ApplyMerchantMappings < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      hh = require_auth!
      mappings = hh.merchant_name_mappings.active
      transactions = hh.transactions.where.not(merchant_name: [nil, ''])

      updated_count = 0

      transactions.find_each do |txn|
        original = txn.merchant_name
        mappings.each do |mapping|
          if mapping.matches?(original)
            txn.update_column(:merchant_name, mapping.clean_name)
            mapping.increment!(:applied_count)
            updated_count += 1
            break # first match wins
          end
        end
      end

      { updated_count: updated_count }
    end
  end
end

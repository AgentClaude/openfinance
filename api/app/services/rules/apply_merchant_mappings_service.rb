module Rules
  class ApplyMerchantMappingsService < ApplicationService
    attr_accessor :household
    validates :household, presence: true
    def call
      return validation_failure(self) unless valid?
      mappings = household.merchant_mappings.active
      return success(updated_count: 0) if mappings.empty?
      updated_count = 0
      household.transactions.find_each do |txn|
        raw = txn.name
        next if raw.blank?
        mappings.each do |mapping|
          if mapping.matches?(raw)
            txn.update!(merchant_name: mapping.clean_name)
            mapping.increment!(:applied_count)
            updated_count += 1
            break
          end
        end
      end
      success(updated_count: updated_count)
    rescue StandardError => e
      failure("Failed to apply merchant mappings: #{e.message}")
    end
  end
end

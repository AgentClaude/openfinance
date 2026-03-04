# frozen_string_literal: true

module Mutations
  class UpdateMerchantMapping < BaseMutation
    argument :id, ID, required: true
    argument :raw_pattern, String, required: false
    argument :clean_name, String, required: false
    argument :match_type, String, required: false
    argument :is_active, Boolean, required: false

    type Types::MerchantMappingType

    def resolve(id:, **attrs)
      hh = require_auth!
      mapping = hh.merchant_mappings.find(id)
      authorize(mapping, :update?)
      mapping.update!(attrs.compact)
      mapping
    end
  end
end

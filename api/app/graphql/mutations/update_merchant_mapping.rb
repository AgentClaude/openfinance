module Mutations
  class UpdateMerchantMapping < BaseMutation
    argument :id, ID, required: true
    argument :raw_pattern, String, required: false
    argument :clean_name, String, required: false
    argument :match_type, String, required: false
    argument :is_active, Boolean, required: false

    type Types::MerchantNameMappingType

    def resolve(id:, **attrs)
      hh = require_auth!
      mapping = hh.merchant_name_mappings.find(id)
      attrs.compact!

      if mapping.update(attrs)
        mapping
      else
        raise GraphQL::ExecutionError, mapping.errors.full_messages.join(', ')
      end
    end
  end
end

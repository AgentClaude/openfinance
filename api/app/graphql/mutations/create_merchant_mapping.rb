module Mutations
  class CreateMerchantMapping < BaseMutation
    argument :raw_pattern, String, required: true
    argument :clean_name, String, required: true
    argument :match_type, String, required: false

    type Types::MerchantNameMappingType

    def resolve(raw_pattern:, clean_name:, match_type: 'contains')
      hh = require_auth!

      mapping = hh.merchant_name_mappings.build(
        raw_pattern: raw_pattern,
        clean_name: clean_name,
        match_type: match_type
      )

      if mapping.save
        mapping
      else
        raise GraphQL::ExecutionError, mapping.errors.full_messages.join(', ')
      end
    end
  end
end

module Mutations
  class CreateMerchantMapping < BaseMutation
    argument :raw_pattern, String, required: true
    argument :clean_name, String, required: true
    argument :match_type, String, required: false
    type Types::MerchantMappingType
    def resolve(raw_pattern:, clean_name:, match_type: 'contains')
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household
      mapping = household.merchant_mappings.build(raw_pattern: raw_pattern, clean_name: clean_name, match_type: match_type)
      if mapping.save then mapping
      else raise GraphQL::ExecutionError, mapping.errors.full_messages.join(', ')
      end
    end
  end
end

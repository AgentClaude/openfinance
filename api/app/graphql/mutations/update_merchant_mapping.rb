module Mutations
  class UpdateMerchantMapping < BaseMutation
    argument :id, ID, required: true
    argument :raw_pattern, String, required: false
    argument :clean_name, String, required: false
    argument :match_type, String, required: false
    argument :is_active, Boolean, required: false

    type Types::MerchantMappingType

    def resolve(id:, **attrs)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      mapping = household.merchant_mappings.find(id)
      if mapping.update(attrs.compact)
        mapping
      else
        raise GraphQL::ExecutionError, mapping.errors.full_messages.join(', ')
      end
    end
  end
end

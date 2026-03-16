module Mutations
  class UpdatePlaidCategoryMapping < BaseMutation
    argument :id, ID, required: true
    argument :category_id, ID, required: true

    type Types::PlaidCategoryMappingType

    def resolve(id:, category_id:)
      hh = require_auth!
      mapping = hh.plaid_category_mappings.find(id)
      category = hh.categories.find(category_id)

      mapping.update!(category: category, is_default: false)
      log_activity(action: 'plaid_mapping_updated', resource: mapping,
                   metadata: { plaid_primary: mapping.plaid_primary, category_name: category.name })
      mapping
    end
  end
end

module Mutations
  class DeleteMerchantMapping < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!
      mapping = hh.merchant_name_mappings.find(id)
      mapping.destroy!
      { success: true }
    end
  end
end

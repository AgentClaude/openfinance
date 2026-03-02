module Mutations
  class DeleteMerchantMapping < BaseMutation
    argument :id, ID, required: true
    field :success, Boolean, null: false
    def resolve(id:)
      hh = require_auth!
      mapping = hh.merchant_mappings.find(id)
      authorize(mapping, :destroy?)
      mapping.destroy!
      { success: true }
    end
  end
end

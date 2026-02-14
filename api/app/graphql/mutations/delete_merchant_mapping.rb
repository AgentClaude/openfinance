module Mutations
  class DeleteMerchantMapping < BaseMutation
    argument :id, ID, required: true
    field :success, Boolean, null: false
    def resolve(id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household
      household.merchant_mappings.find(id).destroy!
      { success: true }
    end
  end
end

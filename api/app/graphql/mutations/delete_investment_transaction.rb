module Mutations
  class DeleteInvestmentTransaction < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!

      result = InvestmentTransactions::DestroyService.call(household: hh, id: id)

      if result.success?
        { success: true }
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

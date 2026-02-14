module Mutations
  class BulkTransactionAction < BaseMutation
    argument :transaction_ids, [ID], required: true
    argument :action, String, required: true
    argument :category_id, ID, required: false

    field :transactions, [Types::TransactionType], null: true
    field :count, Integer, null: false
    field :errors, [String], null: true

    def resolve(transaction_ids:, action:, category_id: nil)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      result = Transactions::BulkActionsService.new(
        household: household,
        transaction_ids: transaction_ids,
        action: action,
        category_id: category_id
      ).call

      if result.success?
        { transactions: result.data[:transactions], count: result.data[:count], errors: [] }
      else
        { transactions: nil, count: 0, errors: [result.error_message] }
      end
    end
  end
end

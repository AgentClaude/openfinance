module Mutations
  class LinkTransfer < BaseMutation
    argument :transaction_a_id, ID, required: true
    argument :transaction_b_id, ID, required: true

    field :transaction_a, Types::TransactionType, null: true
    field :transaction_b, Types::TransactionType, null: true
    field :errors, [String], null: true

    def resolve(transaction_a_id:, transaction_b_id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      service = Transactions::TransferDetectionService.new(household: household)
      result = service.link_transfer!(
        transaction_a_id: transaction_a_id,
        transaction_b_id: transaction_b_id
      )

      if result.success?
        { transaction_a: result.data[:transaction_a], transaction_b: result.data[:transaction_b], errors: [] }
      else
        { transaction_a: nil, transaction_b: nil, errors: [result.error_message] }
      end
    end
  end
end

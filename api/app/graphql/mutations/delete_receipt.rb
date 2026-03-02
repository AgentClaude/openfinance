module Mutations
  class DeleteReceipt < BaseMutation
    argument :transaction_id, ID, required: true

    field :transaction, Types::TransactionType, null: true
    field :errors, [String], null: false

    def resolve(transaction_id:)
      user = context[:current_user]
      return { transaction: nil, errors: ['Not authenticated'] } unless user&.household

      transaction = TransactionPolicy::Scope.new(user, Transaction).resolve.find_by(id: transaction_id)
      return { transaction: nil, errors: ['Transaction not found'] } unless transaction
      return { transaction: nil, errors: ['No receipt attached'] } unless transaction.receipt.attached?

      transaction.receipt.purge
      { transaction: transaction, errors: [] }
    rescue StandardError => e
      { transaction: nil, errors: [e.message] }
    end
  end
end

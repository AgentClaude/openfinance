module Mutations
  class BulkCategorize < BaseMutation
    argument :transaction_ids, [ID], required: true
    argument :category_id, ID, required: true

    type [Types::TransactionType]

    def resolve(transaction_ids:, category_id:)
      hh = require_auth!

      txns = hh.transactions.where(id: transaction_ids)
      txns.update_all(category_id: category_id)
      txns.reload.includes(:account, :category)
    end
  end
end

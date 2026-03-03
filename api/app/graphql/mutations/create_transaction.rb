module Mutations
  class CreateTransaction < BaseMutation
    argument :input, Types::TransactionInputType, required: true

    type Types::TransactionType

    def resolve(input:)
      hh = require_auth!

      txn = hh.transactions.create!(
        account_id: input.account_id,
        name: input.description,
        amount_cents: (input.amount * 100).to_i,
        date: input.date,
        category_id: input.category_id,
        merchant_name: input.merchant_name,
        is_pending: input.pending,
        needs_review: input.needs_review,
        notes: input.notes
      )
      # Check budget thresholds asynchronously
      BudgetCheckJob.safe_perform_later(txn.id) if txn.amount_cents.negative? && txn.category_id

      txn
    end
  end
end

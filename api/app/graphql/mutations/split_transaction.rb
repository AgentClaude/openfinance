module Mutations
  class SplitTransaction < BaseMutation
    argument :transaction_id, ID, required: true
    argument :splits, [Types::SplitInputType], required: true

    field :transaction, Types::TransactionType, null: true
    field :splits, [Types::TransactionType], null: true
    field :errors, [String], null: true

    def resolve(transaction_id:, splits:)
      hh = require_auth!
      txn = authorize(hh.transactions.find(transaction_id), :update?)
      split_params = splits.map do |s|
        {
          amount_cents: (s.amount * 100).round,
          category_id: s.category_id,
          description: s.description
        }
      end

      result = Transactions::SplitService.new(
        transaction: txn,
        splits: split_params,
        household: hh
      ).call

      if result.success?
        { transaction: result.data[:transaction], splits: result.data[:splits], errors: [] }
      else
        { transaction: nil, splits: nil, errors: [result.error_message] }
      end
    end
  end
end

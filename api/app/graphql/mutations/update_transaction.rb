module Mutations
  class UpdateTransaction < BaseMutation
    argument :id, ID, required: true
    argument :input, Types::TransactionInputType, required: true

    type Types::TransactionType

    def resolve(id:, input:)
      hh = require_auth!
      txn = authorize(hh.transactions.find(id), :update?)
      attrs = {}
      attrs[:account_id] = input.account_id if input.respond_to?(:account_id) && !input.account_id.nil?
      attrs[:name] = input.description if input.respond_to?(:description) && !input.description.nil?
      attrs[:amount_cents] = (input.amount * 100).to_i if input.respond_to?(:amount) && !input.amount.nil?
      attrs[:date] = input.date if input.respond_to?(:date) && !input.date.nil?
      attrs[:category_id] = input.category_id if input.respond_to?(:category_id)
      attrs[:merchant_name] = input.merchant_name if input.respond_to?(:merchant_name) && !input.merchant_name.nil?
      attrs[:is_pending] = input.pending if input.respond_to?(:pending) && !input.pending.nil?
      attrs[:needs_review] = input.needs_review if input.respond_to?(:needs_review) && !input.needs_review.nil?
      attrs[:notes] = input.notes if input.respond_to?(:notes) && !input.notes.nil?
      if attrs.any?
        old_category_id = txn.category_id
        txn.update!(attrs)

        # Log categorization as a specific action
        if attrs[:category_id] && attrs[:category_id] != old_category_id
          cat = Category.find_by(id: attrs[:category_id])
          log_activity(action: 'categorized', resource: txn, metadata: {
            category_name: cat&.name,
            transaction_name: txn.name || txn.merchant_name
          })
        elsif attrs.keys != [:category_id]
          log_activity(action: 'updated', resource: txn, metadata: {
            fields: attrs.keys.map(&:to_s),
            transaction_name: txn.name || txn.merchant_name
          })
        end
      end
      txn
    end
  end
end

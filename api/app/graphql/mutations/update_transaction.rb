module Mutations
  class UpdateTransaction < BaseMutation
    argument :id, ID, required: true
    argument :input, Types::TransactionInputType, required: true

    type Types::TransactionType

    def resolve(id:, input:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      txn = household.transactions.find(id)
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
      txn.update!(attrs) if attrs.any?
      txn
    end
  end
end

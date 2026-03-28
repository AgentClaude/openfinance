module Mutations
  class UpdateDebtDetails < BaseMutation
    argument :account_id, ID, required: true
    argument :interest_rate, Float, required: false
    argument :minimum_payment, Float, required: false

    field :account, Types::AccountType, null: true
    field :errors, [String], null: false

    def resolve(account_id:, interest_rate: nil, minimum_payment: nil)
      user = context[:current_user]
      return { account: nil, errors: ['Not authenticated'] } unless user&.household

      account = AccountPolicy::Scope.new(user, Account).resolve.find_by(id: account_id)
      return { account: nil, errors: ['Account not found'] } unless account
      return { account: nil, errors: ['Account is not a debt account'] } unless account.liability?

      attrs = {}
      attrs[:interest_rate] = interest_rate if interest_rate
      attrs[:minimum_payment_cents] = (minimum_payment * 100).round if minimum_payment

      account.update!(attrs)
      { account: account, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { account: nil, errors: e.record.errors.full_messages }
    end
  end
end

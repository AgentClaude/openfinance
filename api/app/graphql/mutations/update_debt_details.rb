module Mutations
  class UpdateDebtDetails < BaseMutation
    argument :account_id, ID, required: true
    argument :interest_rate, Float, required: false
    argument :minimum_payment, Float, required: false

    field :account, Types::AccountType, null: true
    field :errors, [String], null: false

    def resolve(account_id:, interest_rate: nil, minimum_payment: nil)
      result = Debt::UpdateDetailsService.call(
        user: context[:current_user],
        account_id: account_id,
        interest_rate: interest_rate,
        minimum_payment: minimum_payment
      )

      if result.success?
        { account: result.data[:account], errors: [] }
      else
        { account: nil, errors: [result.error_message] }
      end
    end
  end
end

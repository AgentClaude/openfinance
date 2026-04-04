# frozen_string_literal: true

module Mutations
  class UpdateAccount < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :is_hidden, Boolean, required: false
    argument :display_order, Integer, required: false
    argument :interest_rate, Float, required: false
    argument :credit_limit, Float, required: false
    argument :minimum_payment, Float, required: false

    field :account, Types::AccountType, null: true
    field :errors, [String], null: false

    def resolve(id:, **params)
      hh = require_auth!
      account = hh.accounts.find_by(id: id)

      unless account
        return { account: nil, errors: ["Account not found"] }
      end

      authorize(account, :update?)

      result = Accounts::UpdateAccountService.call(
        account: account,
        user: current_user,
        params: params
      )

      if result.success?
        log_activity(
          action: 'account_updated',
          resource: result.data[:account],
          metadata: { changes: params.keys.map(&:to_s) }
        )
        { account: result.data[:account], errors: [] }
      else
        { account: nil, errors: result.errors }
      end
    end
  end
end

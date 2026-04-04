# frozen_string_literal: true

module Mutations
  class ReorderAccounts < BaseMutation
    argument :account_ids, [ID], required: true

    field :accounts, [Types::AccountType], null: false
    field :errors, [String], null: false

    def resolve(account_ids:)
      hh = require_auth!

      result = Accounts::ReorderAccountsService.call(
        household: hh,
        account_ids: account_ids
      )

      if result.success?
        log_activity(
          action: 'accounts_reordered',
          resource: hh,
          metadata: { account_count: account_ids.length }
        )
        { accounts: result.data[:accounts], errors: [] }
      else
        { accounts: [], errors: result.errors }
      end
    end
  end
end

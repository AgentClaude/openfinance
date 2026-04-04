# frozen_string_literal: true

module Mutations
  class ReorderAccounts < BaseMutation
    argument :account_ids, [ID], required: true

    field :accounts, [Types::AccountType], null: false
    field :errors, [String], null: false

    def resolve(account_ids:)
      hh = require_auth!

      accounts = hh.accounts.where(id: account_ids)

      if accounts.count != account_ids.length
        return { accounts: [], errors: ["Some accounts not found or not accessible"] }
      end

      Account.transaction do
        account_ids.each_with_index do |id, index|
          hh.accounts.where(id: id).update_all(display_order: index + 1)
        end
      end

      updated = hh.accounts.where(id: account_ids).order(:display_order)

      log_activity(
        action: 'accounts_reordered',
        resource: hh,
        metadata: { account_count: account_ids.length }
      )

      { accounts: updated, errors: [] }
    end
  end
end

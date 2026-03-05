module Mutations
  class BackfillBalanceHistory < BaseMutation
    argument :months, Integer, required: false, default_value: 12

    field :accounts_processed, Integer, null: false
    field :snapshots_created, Integer, null: false

    def resolve(months:)
      hh = require_auth!

      total_created = 0
      accounts_processed = 0

      hh.accounts.where(is_hidden: false).find_each do |account|
        result = Accounts::BackfillBalanceHistoryService.new(
          account: account,
          months: months
        ).call

        if result.success?
          total_created += result.data[:created]
          accounts_processed += 1
        end
      end

      log_activity(action: 'backfill_balance_history', resource: hh, metadata: {
        accounts_processed: accounts_processed,
        snapshots_created: total_created,
        months: months
      })

      { accounts_processed: accounts_processed, snapshots_created: total_created }
    end
  end
end

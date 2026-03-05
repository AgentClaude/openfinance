module Accounts
  # Backfills AccountBalanceHistory using transaction data to reconstruct
  # approximate historical balances. Works backwards from current balance,
  # subtracting transactions to estimate what the balance was each month.
  #
  # Usage:
  #   Accounts::BackfillBalanceHistoryService.new(account: account, months: 12).call
  #
  class BackfillBalanceHistoryService < ApplicationService
    attr_accessor :account, :months

    validates :account, presence: true

    def call
      return validation_failure(self) unless valid?

      self.months ||= 12
      created = 0

      current_balance = account.current_balance_cents || 0
      today = Date.current

      # Get monthly transaction sums (net change per month)
      # Cast to date so hash keys are Date objects matching our lookups
      raw_changes = account.transactions
        .where('date >= ?', months.months.ago.beginning_of_month)
        .group("DATE_TRUNC('month', date)")
        .sum(:amount_cents)

      # Normalize keys to Date for consistent lookup
      monthly_changes = raw_changes.transform_keys { |k| k.to_date }

      # Build snapshots from present backwards, subtracting each month's
      # net transaction change to reconstruct historical balances.
      running_balance = current_balance

      0.upto(months) do |months_ago|
        snapshot_date = months_ago == 0 ? today : (today - months_ago.months).end_of_month

        # Skip future dates
        next if snapshot_date > today

        # Skip if already exists
        next if AccountBalanceHistory.exists?(account_id: account.id, date: snapshot_date)

        AccountBalanceHistory.create!(
          account: account,
          date: snapshot_date,
          current_balance_cents: running_balance,
          currency: account.currency || 'USD'
        )
        created += 1

        # Subtract this month's net transactions to estimate prior month's balance
        month_key = snapshot_date.beginning_of_month
        month_change = monthly_changes[month_key] || 0
        running_balance -= month_change
      end

      success(created: created, account_id: account.id)
    rescue ActiveRecord::RecordInvalid => e
      failure(e.record.errors.full_messages)
    end
  end
end

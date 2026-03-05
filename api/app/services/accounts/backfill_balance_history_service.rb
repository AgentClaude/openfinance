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
      monthly_changes = account.transactions
        .where('date >= ?', months.months.ago.beginning_of_month)
        .group("DATE_TRUNC('month', date)")
        .sum(:amount_cents)

      # Build snapshots from most recent month backwards
      running_balance = current_balance

      # First, create today's snapshot
      months.downto(0) do |months_ago|
        snapshot_date = (today - months_ago.months).end_of_month
        snapshot_date = today if months_ago == 0

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

        # For next iteration (going further back), subtract this month's transactions
        # to estimate what the balance was before
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

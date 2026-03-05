# Snapshots current balances for all accounts daily.
# Populates AccountBalanceHistory so net worth history and account
# balance charts show real trends over time.
# Designed to run daily via Sidekiq-cron (e.g. 2:00 AM UTC).
class DailyBalanceSnapshotJob < ApplicationJob
  queue_as :default

  def perform(date = nil)
    snapshot_date = date ? Date.parse(date.to_s) : Date.current

    accounts_snapshotted = 0
    accounts_skipped = 0

    Account.includes(:household).find_each do |account|
      # Skip accounts with no household (orphaned)
      next unless account.household

      # Skip if snapshot already exists for this date
      if AccountBalanceHistory.exists?(account_id: account.id, date: snapshot_date)
        accounts_skipped += 1
        next
      end

      AccountBalanceHistory.create!(
        account: account,
        date: snapshot_date,
        current_balance_cents: account.current_balance_cents || 0,
        available_balance_cents: account.try(:available_balance_cents),
        credit_limit_cents: account.try(:credit_limit_cents),
        currency: account.currency || 'USD'
      )

      accounts_snapshotted += 1
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn("[DailyBalanceSnapshotJob] Skipping account #{account.id}: #{e.message}")
    end

    Rails.logger.info(
      "[DailyBalanceSnapshotJob] Date=#{snapshot_date} " \
      "snapshotted=#{accounts_snapshotted} skipped=#{accounts_skipped}"
    )

    { snapshotted: accounts_snapshotted, skipped: accounts_skipped, date: snapshot_date.iso8601 }
  end
end

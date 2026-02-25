class SnapshotBalancesJob < ApplicationJob
  queue_as :default

  # Run daily to capture account balance snapshots for net worth history.
  # Schedule via Sidekiq cron or Rails recurring tasks.
  def perform
    today = Date.current

    Account.where(is_hidden: false).find_each do |account|
      AccountBalanceHistory.find_or_create_by(account: account, date: today) do |snapshot|
        snapshot.current_balance_cents = account.current_balance_cents
        snapshot.available_balance_cents = account.available_balance_cents
        snapshot.credit_limit_cents = account.credit_limit_cents
        snapshot.currency = account.currency || 'USD'
      end
    end

    Rails.logger.info "[SnapshotBalancesJob] Captured balance snapshots for #{today}"
  end
end

# Daily job to snapshot account balances for net worth history tracking

class BalanceSnapshotJob < ApplicationJob
  queue_as :default

  def perform
    today = Date.current

    Account.where(is_hidden: false).find_each do |account|
      next if AccountBalanceHistory.exists?(account: account, date: today)

      AccountBalanceHistory.create!(
        account: account,
        date: today,
        balance_cents: account.current_balance_cents
      )
    rescue StandardError => e
      Rails.logger.error "Balance snapshot failed for account #{account.id}: #{e.message}"
    end

    Rails.logger.info "Balance snapshots completed for #{today}"
  end
end

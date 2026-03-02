# Takes daily snapshots of all account balances for net worth history
class DailyBalanceSnapshotJob < ApplicationJob
  queue_as :low

  def perform
    today = Date.current

    Account.find_each do |account|
      next if AccountBalanceHistory.exists?(account: account, date: today)

      AccountBalanceHistory.create!(
        account: account,
        date: today,
        current_balance_cents: account.current_balance_cents
      )
    rescue => e
      Rails.logger.error "Balance snapshot failed for account #{account.id}: #{e.message}"
    end

    Rails.logger.info "Daily balance snapshots completed for #{Date.current}"
  end
end

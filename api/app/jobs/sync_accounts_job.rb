# Background job for syncing accounts from financial providers
# This is a wrapper around SyncTransactionsJob for legacy compatibility

class SyncAccountsJob < ApplicationJob
  queue_as :default

  def perform(connection)
    # Delegate to the actual sync transactions job
    SyncTransactionsJob.safe_perform_later(connection)
  end

  # Cancel sync jobs for a specific connection
  def self.cancel_for_connection(connection_id)
    SyncTransactionsJob.cancel_for_connection(connection_id)
  end
end
# Background job for syncing transactions from Plaid
# Handles fetching new transactions and updating existing ones

class SyncTransactionsJob < ApplicationJob
  queue_as :high
  
  # Rate limiting handled at the service level

  def perform(connection)
    return unless connection.active? && connection.plaid?

    Rails.logger.info "Starting transaction sync for connection #{connection.id}"

    sync_log = connection.sync_logs.create!(
      status: 'started',
      started_at: Time.current
    )

    begin
      result = Plaid::SyncTransactionsService.call(connection: connection)
      
      if result.success?
        sync_log.update!(
          status: 'completed',
          completed_at: Time.current,
          transactions_added: result.data[:added] || 0,
          transactions_updated: result.data[:modified] || 0
        )

        Rails.logger.info "Successfully synced #{result.data[:added]} added, #{result.data[:modified]} modified, #{result.data[:removed]} removed transactions"
      else
        handle_sync_failure(connection, sync_log, result.error_messages.join(', '))
      end

    rescue StandardError => e
      handle_sync_failure(connection, sync_log, e.message)
      raise e
    end
  end

  # Cancel sync jobs for a specific connection
  def self.cancel_for_connection(connection_id)
    cancel_for(connection_id.to_s)
  end

  private

  def handle_sync_failure(connection, sync_log, error_message)
    sync_log.update!(
      status: 'failed',
      completed_at: Time.current,
      error_message: error_message
    )

    # Update connection status based on error type
    if retryable_error?(error_message)
      Rails.logger.warn "Retryable sync error for connection #{connection.id}: #{error_message}"
    else
      connection.mark_error!('SYNC_ERROR', error_message)
      Rails.logger.error "Sync failed for connection #{connection.id}: #{error_message}"
    end
  end

  def retryable_error?(error_message)
    retryable_patterns = [
      /timeout/i,
      /rate limit/i,
      /server error/i,
      /temporarily unavailable/i
    ]

    retryable_patterns.any? { |pattern| error_message.match?(pattern) }
  end
end
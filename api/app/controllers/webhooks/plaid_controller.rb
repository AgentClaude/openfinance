module Webhooks
  class PlaidController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false
    skip_before_action :authenticate_user!, raise: false

    # POST /webhooks/plaid
    def create
      webhook_type = params[:webhook_type]
      webhook_code = params[:webhook_code]
      item_id = params[:item_id]

      Rails.logger.info "Plaid webhook received: #{webhook_type}/#{webhook_code} for item #{item_id}"

      connection = AccountConnection.find_by(provider_connection_id: item_id)
      unless connection
        Rails.logger.warn "No connection found for Plaid item #{item_id}"
        head :ok
        return
      end

      case webhook_type
      when 'TRANSACTIONS'
        handle_transactions_webhook(connection, webhook_code)
      when 'ITEM'
        handle_item_webhook(connection, webhook_code, params)
      when 'AUTH'
        handle_auth_webhook(connection, webhook_code)
      else
        Rails.logger.info "Unhandled Plaid webhook type: #{webhook_type}"
      end

      head :ok
    rescue StandardError => e
      Rails.logger.error "Plaid webhook error: #{e.message}"
      head :ok # Always return 200 to Plaid
    end

    private

    def handle_transactions_webhook(connection, code)
      case code
      when 'SYNC_UPDATES_AVAILABLE'
        # New transactions available — trigger sync
        Rails.logger.info "Transaction sync updates available for connection #{connection.id}"
        SyncTransactionsJob.safe_perform_later(connection) if connection.active?
      when 'INITIAL_UPDATE'
        # Initial transaction pull complete (last 30 days)
        Rails.logger.info "Initial transaction update for connection #{connection.id}"
        SyncTransactionsJob.safe_perform_later(connection) if connection.active?
      when 'HISTORICAL_UPDATE'
        # Historical transaction pull complete (up to 2 years)
        Rails.logger.info "Historical transaction update for connection #{connection.id}"
        SyncTransactionsJob.safe_perform_later(connection) if connection.active?
      when 'TRANSACTIONS_REMOVED'
        # Transactions removed — sync to reflect deletions
        Rails.logger.info "Transactions removed for connection #{connection.id}"
        SyncTransactionsJob.safe_perform_later(connection) if connection.active?
      when 'DEFAULT_UPDATE'
        # Fired when new transactions are available (legacy, still sent)
        SyncTransactionsJob.safe_perform_later(connection) if connection.active?
      end
    end

    def handle_item_webhook(connection, code, params)
      case code
      when 'ERROR'
        error_data = params[:error] || {}
        error_code = error_data[:error_code] || 'UNKNOWN'
        error_message = error_data[:error_message] || 'An error occurred'

        Rails.logger.error "Plaid item error for connection #{connection.id}: #{error_code} - #{error_message}"
        connection.mark_error!(error_code, error_message)

        # Create notification for the user
        create_connection_notification(connection, :error,
          "Connection issue with #{connection.institution_name}: #{connection.error_display_message}")
      when 'LOGIN_REPAIRED'
        # User fixed their credentials via update mode
        Rails.logger.info "Login repaired for connection #{connection.id}"
        connection.reconnect!

        create_connection_notification(connection, :info,
          "#{connection.institution_name} connection restored!")
      when 'PENDING_EXPIRATION'
        # Consent is about to expire (7 days warning)
        Rails.logger.warn "Consent expiring soon for connection #{connection.id}"
        connection.update!(consent_expires_at: params[:consent_expiration_time]&.to_datetime)

        create_connection_notification(connection, :warning,
          "#{connection.institution_name} connection will expire soon. Please reconnect.")
      when 'USER_PERMISSION_REVOKED'
        Rails.logger.info "User revoked permission for connection #{connection.id}"
        connection.disconnect!

        create_connection_notification(connection, :info,
          "#{connection.institution_name} connection was disconnected.")
      when 'WEBHOOK_UPDATE_ACKNOWLEDGED'
        Rails.logger.info "Webhook URL updated for connection #{connection.id}"
      end
    end

    def handle_auth_webhook(connection, code)
      case code
      when 'AUTOMATICALLY_VERIFIED'
        Rails.logger.info "Auth automatically verified for connection #{connection.id}"
      when 'VERIFICATION_EXPIRED'
        Rails.logger.warn "Auth verification expired for connection #{connection.id}"
      end
    end

    def create_connection_notification(connection, level, message)
      connection.household.users.each do |user|
        Notification.create(
          user: user,
          notification_type: 'account_connection',
          title: "Bank Connection Update",
          message: message,
          severity: level.to_s,
          metadata: { connection_id: connection.id, institution_name: connection.institution_name }
        )
      rescue StandardError => e
        Rails.logger.warn "Failed to create notification: #{e.message}"
      end
    end
  end
end

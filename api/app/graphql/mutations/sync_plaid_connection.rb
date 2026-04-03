module Mutations
  class SyncPlaidConnection < BaseMutation
    argument :connection_id, ID, required: true

    field :success, Boolean, null: false
    field :added_count, Integer, null: true
    field :modified_count, Integer, null: true
    field :removed_count, Integer, null: true
    field :error_message, String, null: true
    field :connection, Types::AccountConnectionType, null: true, connection: false

    def resolve(connection_id:)
      household = require_auth!

      connection = household.account_connections.find(connection_id)

      unless connection.provider == 'plaid'
        raise GraphQL::ExecutionError, "Only Plaid connections can be synced"
      end

      unless connection.active? || connection.retryable_error?
        raise GraphQL::ExecutionError, "Connection cannot be synced in its current state"
      end

      if connection.sync_in_progress?
        raise GraphQL::ExecutionError, "Sync is already in progress"
      end

      # Clear error state if retryable
      if connection.retryable_error?
        connection.update!(status: 'active', error_code: nil, error_message: nil)
      end

      adapter = Providers::Plaid.new(connection)
      result = adapter.sync_transactions

      if result.success?
        connection.reload
        {
          success: true,
          added_count: result.data[:added] || 0,
          modified_count: result.data[:modified] || 0,
          removed_count: result.data[:removed] || 0,
          error_message: nil,
          connection: connection
        }
      else
        {
          success: false,
          added_count: nil,
          modified_count: nil,
          removed_count: nil,
          error_message: result.errors.join(", "),
          connection: connection.reload
        }
      end
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Connection not found"
    end
  end
end

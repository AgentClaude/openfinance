module Mutations
  class RetryConnectionSync < BaseMutation
    argument :connection_id, ID, required: true

    field :success, Boolean, null: false

    def resolve(connection_id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      connection = user.household.account_connections.find(connection_id)

      unless connection.active? || connection.retryable_error?
        raise GraphQL::ExecutionError, "Connection cannot be synced in its current state"
      end

      # Clear error state if retryable
      if connection.retryable_error?
        connection.update!(status: 'active', error_code: nil, error_message: nil)
      end

      SyncTransactionsJob.safe_perform_later(connection)

      { success: true }
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Connection not found"
    end
  end
end

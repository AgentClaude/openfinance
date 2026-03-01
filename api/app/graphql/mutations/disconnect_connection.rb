module Mutations
  class DisconnectConnection < BaseMutation
    argument :connection_id, ID, required: true

    field :success, Boolean, null: false

    def resolve(connection_id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      connection = user.household.account_connections.find(connection_id)
      connection.disconnect!

      { success: true }
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Connection not found"
    end
  end
end

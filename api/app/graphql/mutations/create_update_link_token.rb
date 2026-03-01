module Mutations
  class CreateUpdateLinkToken < BaseMutation
    argument :connection_id, ID, required: true

    type Types::PlaidLinkTokenType, null: false

    def resolve(connection_id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      connection = user.household.account_connections.find(connection_id)

      unless connection.plaid?
        raise GraphQL::ExecutionError, "Update mode is only supported for Plaid connections"
      end

      # Create link token in update mode using the existing access token
      return failure_response("Plaid is not configured") unless PlaidConfig.enabled?

      request = Plaid::LinkTokenCreateRequest.new({
        client_name: 'OpenFinance',
        country_codes: %w[US CA],
        language: 'en',
        user: { client_user_id: user.id.to_s },
        access_token: connection.provider_access_token
      })

      webhook_url = ENV['PLAID_WEBHOOK_URL']
      request.webhook = webhook_url if webhook_url.present?

      response = PlaidConfig.client.link_token_create(request)

      { link_token: response.link_token, expiration: response.expiration }
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Connection not found"
    rescue Plaid::ApiError => e
      error_info = PlaidErrorHandler.handle_error(e)
      raise GraphQL::ExecutionError, error_info[:display_message] || "Failed to create update link token"
    end

    private

    def failure_response(msg)
      raise GraphQL::ExecutionError, msg
    end
  end
end

module Mutations
  class CreatePlaidLinkToken < BaseMutation
    type Types::PlaidLinkTokenType, null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      # Use provider adapter pattern - creates a temporary adapter for link token generation
      adapter = Providers::Plaid.new(nil)
      result = adapter.create_link_token(user: user)

      if result.success?
        { link_token: result.data[:link_token], expiration: result.data[:expiration] }
      else
        raise GraphQL::ExecutionError, result.errors.join(", ")
      end
    end
  end
end

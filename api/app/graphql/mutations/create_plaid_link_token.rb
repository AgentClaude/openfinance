module Mutations
  class CreatePlaidLinkToken < BaseMutation
    type Types::PlaidLinkTokenType, null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      result = Plaid::CreateLinkTokenService.call(user: user)

      if result.success?
        { link_token: result.data[:link_token], expiration: result.data[:expiration] }
      else
        raise GraphQL::ExecutionError, result.errors.join(", ")
      end
    end
  end
end

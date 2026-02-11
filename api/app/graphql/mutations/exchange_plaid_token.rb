module Mutations
  class ExchangePlaidToken < BaseMutation
    argument :public_token, String, required: true
    argument :metadata, GraphQL::Types::JSON, required: false

    type [Types::AccountType], null: false

    def resolve(public_token:, metadata: {})
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      result = Plaid::ExchangePublicTokenService.call(
        public_token: public_token,
        user: user,
        metadata: metadata || {}
      )

      if result.success?
        result.data[:accounts]
      else
        raise GraphQL::ExecutionError, result.errors.join(", ")
      end
    end
  end
end

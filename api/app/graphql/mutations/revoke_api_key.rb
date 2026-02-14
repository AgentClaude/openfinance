module Mutations
  class RevokeApiKey < BaseMutation
    argument :id, ID, required: true

    field :api_key, Types::ApiKeyType, null: true
    field :errors, [String], null: false

    def resolve(id:)
      user = context[:current_user]
      return { api_key: nil, errors: ['Not authenticated'] } unless user

      api_key = user.api_keys.find(id)
      api_key.revoke!
      { api_key: api_key, errors: [] }
    rescue ActiveRecord::RecordNotFound
      { api_key: nil, errors: ['API key not found'] }
    end
  end
end

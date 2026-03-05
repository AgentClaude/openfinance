module Mutations
  class CreateApiKey < BaseMutation
    argument :name, String, required: true

    field :api_key, Types::ApiKeyType, null: true
    field :errors, [String], null: false
    field :plain_text_key, String, null: true, description: "Full API key (only returned on creation)"

    def resolve(name:)
      user = context[:current_user]
      return { api_key: nil, plain_text_key: nil, errors: ['Not authenticated'] } unless user

      api_key = user.api_keys.create!(name: name)
      { api_key: api_key, plain_text_key: api_key.key, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { api_key: nil, plain_text_key: nil, errors: e.record.errors.full_messages }
    end
  end
end

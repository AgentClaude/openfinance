module Types
  class ApiKeyType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :key, String, null: false, description: "Masked key (full key only returned on creation)"
    field :last_used_at, GraphQL::Types::ISO8601DateTime, null: true
    field :revoked_at, GraphQL::Types::ISO8601DateTime, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :revoked, Boolean, null: false

    def key
      "#{object.key[0..7]}#{'*' * 24}"
    end

    def revoked
      object.revoked?
    end
  end
end

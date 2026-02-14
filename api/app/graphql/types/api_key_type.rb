module Types
  class ApiKeyType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :key, String, null: false
    field :last_used_at, GraphQL::Types::ISO8601DateTime, null: true
    field :revoked_at, GraphQL::Types::ISO8601DateTime, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :revoked, Boolean, null: false

    def revoked
      object.revoked?
    end
  end
end

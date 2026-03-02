module Types
  class HouseholdType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :currency, String, null: false
    field :timezone, String, null: true
    field :preferences, GraphQL::Types::JSON, null: false

    def currency
      object.currency || "USD"
    end

    def timezone
      object.timezone || "America/New_York"
    end

    def preferences
      object.preferences || {}
    end
  end
end

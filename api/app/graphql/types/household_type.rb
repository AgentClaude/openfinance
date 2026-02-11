module Types
  class HouseholdType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :currency, String, null: false

    def currency
      "USD"
    end
  end
end

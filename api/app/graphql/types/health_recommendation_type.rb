module Types
  class HealthRecommendationType < Types::BaseObject
    field :type, String, null: false
    field :category, String, null: true
    field :message, String, null: false
  end
end

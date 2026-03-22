module Types
  class FinancialHealthType < Types::BaseObject
    field :score, Integer, null: false
    field :grade, String, null: false
    field :components, [Types::HealthComponentType], null: false
    field :recommendations, [Types::HealthRecommendationType], null: false
  end
end

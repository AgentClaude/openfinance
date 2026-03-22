module Types
  class HealthComponentType < Types::BaseObject
    field :name, String, null: false
    field :label, String, null: false
    field :raw_score, Integer, null: false
    field :weight, Integer, null: false
    field :weighted_score, Float, null: false
    field :status, String, null: false
    field :details, GraphQL::Types::JSON, null: false
  end
end

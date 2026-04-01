module Types
  class SavingsRecommendationType < Types::BaseObject
    field :type, String, null: false
    field :icon, String, null: false
    field :title, String, null: false
    field :description, String, null: false
    field :impact, String, null: true
  end
end

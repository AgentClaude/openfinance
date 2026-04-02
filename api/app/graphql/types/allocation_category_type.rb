module Types
  class AllocationCategoryType < Types::BaseObject
    field :amount, Float, null: false
    field :percent, Float, null: false
    field :target_percent, Integer, null: false
    field :status, String, null: false
  end
end

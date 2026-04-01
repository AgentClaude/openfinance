module Types
  class FireMilestoneType < Types::BaseObject
    field :name, String, null: false
    field :target, Float, null: false
    field :current, Float, null: false
    field :reached, Boolean, null: false
    field :percent, Float, null: false
  end
end

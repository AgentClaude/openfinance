module Types
  class FireScenarioType < Types::BaseObject
    field :savings_rate, Integer, null: false
    field :monthly_savings, Float, null: false
    field :years_to_fire, Integer, null: true
    field :is_current, Boolean, null: false
  end
end

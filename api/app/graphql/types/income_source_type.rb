module Types
  class IncomeSourceType < Types::BaseObject
    field :name, String, null: false
    field :icon, String, null: true
    field :color, String, null: true
    field :total, Float, null: false
    field :monthly_average, Float, null: false
    field :percent, Float, null: false
  end
end

module Types
  class ForecastWarningType < Types::BaseObject
    field :date, String, null: false
    field :projected_balance, Float, null: false
    field :message, String, null: false
  end
end

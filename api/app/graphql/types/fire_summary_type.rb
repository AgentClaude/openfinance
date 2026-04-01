module Types
  class FireSummaryType < Types::BaseObject
    field :fire_number, Float, null: false
    field :coast_fire_number, Float, null: false
    field :coast_fire_age, Integer, null: true
    field :years_to_fire, Integer, null: true
    field :fire_age, Integer, null: true
    field :savings_rate, Float, null: false
    field :monthly_savings, Float, null: false
    field :progress_percent, Float, null: false
    field :current_age, Integer, null: false
    field :retirement_age, Integer, null: false
    field :withdrawal_rate, Float, null: false
    field :annual_return_rate, Float, null: false
    field :inflation_rate, Float, null: false
  end
end

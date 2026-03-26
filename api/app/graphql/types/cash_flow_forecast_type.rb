module Types
  class CashFlowForecastType < Types::BaseObject
    field :starting_balance, Float, null: false
    field :ending_balance, Float, null: false
    field :forecast_days, Integer, null: false
    field :total_projected_income, Float, null: false
    field :total_projected_expenses, Float, null: false
    field :net_cash_flow, Float, null: false
    field :min_balance, Float, null: false
    field :min_balance_date, String, null: true
    field :max_balance, Float, null: false
    field :max_balance_date, String, null: true
    field :daily_projections, [Types::ForecastDayType], null: false
    field :events, [Types::ForecastEventType], null: false
    field :warnings, [Types::ForecastWarningType], null: false
  end
end

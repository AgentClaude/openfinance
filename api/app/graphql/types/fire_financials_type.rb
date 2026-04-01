module Types
  class FireFinancialsType < Types::BaseObject
    field :monthly_income, Float, null: false
    field :monthly_expenses, Float, null: false
    field :monthly_savings, Float, null: false
    field :annual_income, Float, null: false
    field :annual_expenses, Float, null: false
    field :annual_savings, Float, null: false
    field :invested_assets, Float, null: false
    field :total_net_worth, Float, null: false
  end
end

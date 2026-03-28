module Types
  class RecapNetWorthType < Types::BaseObject
    field :current, Float, null: false
    field :start_of_month, Float, null: false
    field :change, Float, null: false
    field :change_percentage, Float, null: false
    field :assets, Float, null: false
    field :liabilities, Float, null: false
  end
end

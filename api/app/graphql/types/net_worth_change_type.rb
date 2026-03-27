module Types
  class NetWorthChangeType < Types::BaseObject
    field :start_of_year, Float, null: false
    field :end_of_period, Float, null: false
    field :change, Float, null: false
    field :change_percentage, Float, null: false
  end
end

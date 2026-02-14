module Types
  class NetWorthSnapshotType < Types::BaseObject
    field :date, String, null: false
    field :assets, Float, null: false
    field :liabilities, Float, null: false
    field :net_worth, Float, null: false
  end
end

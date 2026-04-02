module Types
  class SavingsRateMonthSnapshotType < Types::BaseObject
    field :month, String, null: false
    field :savings_rate, Float, null: false
  end
end

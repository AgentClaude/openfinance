module Types
  class HeatmapStreaksType < Types::BaseObject
    field :longest_no_spend_days, Integer, null: false
    field :longest_no_spend_start, String, null: true
    field :longest_no_spend_end, String, null: true
    field :current_no_spend_streak, Integer, null: false
  end
end

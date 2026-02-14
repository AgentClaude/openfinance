module Types
  class GoalType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :goal_type, String, null: false
    field :target_amount, Float, null: false
    field :current_amount, Float, null: false
    field :icon, String, null: true
    field :color, String, null: true
    field :currency, String, null: false
    field :target_date, String, null: true
    field :start_date, String, null: true
    field :is_active, Boolean, null: false
    field :is_achieved, Boolean, null: false
    field :achieved_at, GraphQL::Types::ISO8601DateTime, null: true
    field :progress_percentage, Float, null: false
    field :amount_remaining, Float, null: false
    field :days_remaining, Integer, null: false
    field :is_overdue, Boolean, null: false
    field :is_on_track, Boolean, null: false
    field :monthly_target, Float, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def target_amount
      object.target_amount_cents / 100.0
    end

    def current_amount
      object.current_amount_cents / 100.0
    end

    def target_date
      object.target_date&.iso8601
    end

    def start_date
      object.start_date&.iso8601
    end

    def is_overdue
      object.overdue?
    end

    def is_on_track
      object.on_track?
    end

    def monthly_target
      object.monthly_target_to_complete
    end
  end
end

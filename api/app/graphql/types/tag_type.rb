module Types
  class TagType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :color, String, null: true
    field :household_id, ID, null: false
    field :transactions_count, Integer, null: false
    field :is_active, Boolean, null: false

    def color
      object.color_hex
    end

    def transactions_count
      object.transactions.count
    end

    def is_active
      object.is_active
    end
  end
end

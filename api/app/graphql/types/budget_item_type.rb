module Types
  class BudgetItemType < Types::BaseObject
    field :id, ID, null: false
    field :category_id, ID, null: false
    field :budgeted, Float, null: false
    field :spent, Float, null: false
    field :month, String, null: false
    field :category, Types::CategoryType, null: true

    def budgeted
      object.amount_cents / 100.0
    end

    def spent
      # Calculate actual spending for this category in this month
      start_date = object.month.beginning_of_month
      end_date = object.month.end_of_month
      cents = object.category.transactions
        .where(date: start_date..end_date)
        .where('amount_cents < 0')
        .sum(:amount_cents)
        .abs
      cents / 100.0
    end

    def month
      object.month.strftime('%Y-%m')
    end
  end
end

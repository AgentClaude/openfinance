module Types
  class BudgetItemType < Types::BaseObject
    field :id, ID, null: false
    field :category_id, ID, null: false
    field :budgeted, Float, null: false
    field :spent, Float, null: false
    field :rollover, Float, null: false
    field :available, Float, null: false
    field :percent_used, Float, null: false
    field :month, String, null: false
    field :category, Types::CategoryType, null: true

    def budgeted
      object.amount_cents / 100.0
    end

    def spent
      # Use precomputed spent values from context (set by budget/budget_summary resolvers)
      # to avoid N+1 queries per budget item
      month_key = object.month.beginning_of_month.to_s
      precomputed = context[:budget_spent_by_category]&.dig(month_key, object.category_id)
      return precomputed if precomputed

      # Fallback for direct item resolution without precomputation
      start_date = object.month.beginning_of_month
      end_date = object.month.end_of_month
      cents = object.category.transactions
        .where(date: start_date..end_date)
        .where('amount_cents < 0')
        .sum(:amount_cents)
        .abs
      cents / 100.0
    end

    def rollover
      object.rollover_cents / 100.0
    end

    def available
      budgeted + rollover - spent
    end

    def percent_used
      b = budgeted
      return 0.0 if b == 0
      (spent / b * 100).round(1)
    end

    def month
      object.month.strftime('%Y-%m')
    end
  end
end

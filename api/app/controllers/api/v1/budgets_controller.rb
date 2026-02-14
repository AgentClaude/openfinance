module Api
  module V1
    class BudgetsController < BaseController
      def show
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        month_str = params[:month] || Date.current.strftime('%Y-%m')
        date = Date.parse("#{month_str}-01")

        budget = household.budgets.active.first
        return render json: { error: 'No active budget found' }, status: :not_found unless budget

        start_date = date.beginning_of_month
        end_date = date.end_of_month

        items = budget.budget_items.includes(:category).map do |item|
          spent_cents = household.transactions
            .where(category_id: item.category_id, date: start_date..end_date)
            .where('amount_cents < 0')
            .sum(:amount_cents).abs

          {
            category: item.category&.name,
            category_id: item.category_id,
            budgeted_cents: item.amount_cents,
            budgeted: (item.amount_cents / 100.0).round(2),
            spent_cents: spent_cents,
            spent: (spent_cents / 100.0).round(2),
            remaining_cents: item.amount_cents - spent_cents,
            remaining: ((item.amount_cents - spent_cents) / 100.0).round(2)
          }
        end

        total_budgeted = items.sum { |i| i[:budgeted_cents] }
        total_spent = items.sum { |i| i[:spent_cents] }

        render json: {
          month: month_str, budget_name: budget.name,
          total_budgeted_cents: total_budgeted, total_budgeted: (total_budgeted / 100.0).round(2),
          total_spent_cents: total_spent, total_spent: (total_spent / 100.0).round(2),
          items: items
        }
      rescue Date::Error
        render json: { error: 'Invalid month format. Use YYYY-MM' }, status: :bad_request
      end
    end
  end
end

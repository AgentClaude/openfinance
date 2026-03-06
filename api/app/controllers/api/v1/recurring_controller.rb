module Api
  module V1
    class RecurringController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        items = household.recurring_items.includes(:category, :account)

        # Filter by status
        case params[:status]
        when 'active' then items = items.active
        when 'inactive' then items = items.inactive
        end

        # Filter by type
        case params[:type]
        when 'income' then items = items.income
        when 'expense' then items = items.expenses
        end

        items = items.order(:next_occurrence)

        result = items.map do |item|
          status = if !item.is_active
                     'inactive'
                   elsif item.overdue?
                     'overdue'
                   elsif item.due_soon?
                     'upcoming'
                   else
                     'active'
                   end

          {
            id: item.id,
            name: item.name,
            amount_cents: item.amount_cents,
            amount: item.amount.round(2),
            frequency: item.frequency,
            estimated_monthly_amount: item.estimated_monthly_amount.round(2),
            next_occurrence: item.next_occurrence&.to_s,
            last_occurrence: item.last_occurrence&.to_s,
            category: item.category&.name,
            account: item.account&.name,
            is_income: item.is_income,
            is_active: item.is_active,
            is_auto_detected: item.is_auto_detected,
            status: status,
            days_until_due: item.days_until_due,
            currency: item.currency
          }
        end

        monthly_expenses = items.active.expenses.sum { |i| i.estimated_monthly_amount }
        monthly_income = items.active.income.sum { |i| i.estimated_monthly_amount }

        render json: {
          recurring_items: result,
          count: result.size,
          summary: {
            monthly_expenses: monthly_expenses.round(2),
            monthly_income: monthly_income.round(2),
            upcoming_count: items.active.select(&:due_soon?).size,
            overdue_count: items.active.select(&:overdue?).size
          }
        }
      end
    end
  end
end

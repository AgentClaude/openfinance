module Api
  module V1
    class MonthlySummaryController < BaseController
      def show
        month_str = params[:month] || Date.current.strftime('%Y-%m')
        date = Date.parse("#{month_str}-01")
        start_date = date.beginning_of_month
        end_date = date.end_of_month
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        txns = household.transactions.where(date: start_date..end_date)
        income_cents = txns.where('amount_cents > 0').sum(:amount_cents)
        expense_cents = txns.where('amount_cents < 0').sum(:amount_cents).abs
        savings_rate = income_cents > 0 ? ((income_cents - expense_cents).to_f / income_cents * 100).round(2) : 0

        render json: {
          month: month_str, income_cents: income_cents, income: (income_cents / 100.0).round(2),
          expenses_cents: expense_cents, expenses: (expense_cents / 100.0).round(2),
          net_cents: income_cents - expense_cents, net: ((income_cents - expense_cents) / 100.0).round(2),
          savings_rate: savings_rate, transaction_count: txns.count
        }
      rescue Date::Error
        render json: { error: 'Invalid month format. Use YYYY-MM' }, status: :bad_request
      end
    end
  end
end

module Api
  module V1
    class DailySpendController < BaseController
      def show
        date = Date.parse(params[:date] || Date.current.to_s)
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        transactions = household.transactions.where(date: date).where('amount_cents < 0').includes(:account, :category)
        total_cents = transactions.sum(:amount_cents).abs

        items = transactions.map do |t|
          { id: t.id, merchant: t.merchant_name, amount_cents: t.amount_cents.abs,
            amount: (t.amount_cents.abs / 100.0).round(2), category: t.category&.name, account: t.account.name }
        end

        render json: { date: date.to_s, total_cents: total_cents, total: (total_cents / 100.0).round(2),
                       transaction_count: transactions.size, transactions: items }
      rescue Date::Error
        render json: { error: 'Invalid date format. Use YYYY-MM-DD' }, status: :bad_request
      end
    end
  end
end

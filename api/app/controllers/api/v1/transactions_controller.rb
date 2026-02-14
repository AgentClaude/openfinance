module Api
  module V1
    class TransactionsController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        limit = [(params[:limit] || 50).to_i, 200].min
        txns = household.transactions.includes(:account, :category).ordered.limit(limit)

        items = txns.map do |t|
          { id: t.id, date: t.date.to_s, merchant: t.merchant_name,
            amount_cents: t.amount_cents, amount: (t.amount_cents / 100.0).round(2),
            category: t.category&.name, account: t.account.name, pending: t.is_pending, currency: t.currency }
        end

        render json: { transactions: items, count: items.size }
      end
    end
  end
end

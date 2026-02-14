module Api
  module V1
    class TransactionsController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        limit = [(params[:limit] || 50).to_i, 200].min
        offset = [params[:offset].to_i, 0].max
        txns = household.transactions.includes(:account, :category)

        # Date filters
        if params[:start_date].present?
          txns = txns.where('date >= ?', Date.parse(params[:start_date]))
        end
        if params[:end_date].present?
          txns = txns.where('date <= ?', Date.parse(params[:end_date]))
        end

        # Category filter
        if params[:category].present?
          txns = txns.joins(:category).where(categories: { name: params[:category] })
        end

        # Account filter
        if params[:account_id].present?
          txns = txns.where(account_id: params[:account_id])
        end

        total = txns.count
        txns = txns.ordered.offset(offset).limit(limit)

        items = txns.map do |t|
          { id: t.id, date: t.date.to_s, merchant: t.merchant_name,
            amount_cents: t.amount_cents, amount: (t.amount_cents / 100.0).round(2),
            category: t.category&.name, account: t.account.name, pending: t.is_pending, currency: t.currency }
        end

        render json: { transactions: items, count: items.size, total: total, limit: limit, offset: offset }
      rescue Date::Error
        render json: { error: 'Invalid date format. Use YYYY-MM-DD' }, status: :bad_request
      end
    end
  end
end

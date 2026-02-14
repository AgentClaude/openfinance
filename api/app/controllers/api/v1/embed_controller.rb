module Api
  module V1
    class EmbedController < ApplicationController
      def net_worth
        share_token = ShareToken.active.find_by!(token: params[:token], widget_type: 'net_worth')
        household = share_token.user.household
        return render json: { error: 'No household' }, status: :not_found unless household

        accounts = household.accounts.visible
        assets = accounts.assets.sum(:current_balance_cents)
        liabilities = accounts.liabilities.sum(:current_balance_cents)

        render json: { net_worth: ((assets - liabilities) / 100.0).round(2),
                       assets: (assets / 100.0).round(2), liabilities: (liabilities / 100.0).round(2),
                       updated_at: Time.current.iso8601 }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Invalid or expired token' }, status: :not_found
      end

      def spending
        share_token = ShareToken.active.find_by!(token: params[:token], widget_type: 'spending')
        household = share_token.user.household
        return render json: { error: 'No household' }, status: :not_found unless household

        date = Date.current
        txns = household.transactions.where(date: date.beginning_of_month..date).where('amount_cents < 0')

        render json: { month: date.strftime('%Y-%m'), total_spent: (txns.sum(:amount_cents).abs / 100.0).round(2),
                       transaction_count: txns.count, updated_at: Time.current.iso8601 }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Invalid or expired token' }, status: :not_found
      end
    end
  end
end

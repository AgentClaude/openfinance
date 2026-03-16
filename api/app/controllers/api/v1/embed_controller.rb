module Api
  module V1
    class EmbedController < ApplicationController
      # JSON endpoints (default) + HTML iframe-ready widgets (via .html suffix)
      def net_worth
        share_token = ShareToken.active.find_by!(token: params[:token], widget_type: 'net_worth')
        household = share_token.user.household
        return render json: { error: 'No household' }, status: :not_found unless household

        accounts = household.accounts.visible
        assets = accounts.assets.sum(:current_balance_cents)
        liabilities = accounts.liabilities.sum(:current_balance_cents)

        data = {
          net_worth: ((assets - liabilities) / 100.0).round(2),
          assets: (assets / 100.0).round(2),
          liabilities: (liabilities / 100.0).round(2),
          updated_at: Time.current.iso8601
        }

        render_widget(data) { EmbedRenderer.net_worth_html(data, theme_param) }
      rescue ActiveRecord::RecordNotFound
        render_not_found
      end

      def spending
        share_token = ShareToken.active.find_by!(token: params[:token], widget_type: 'spending')
        household = share_token.user.household
        return render json: { error: 'No household' }, status: :not_found unless household

        date = Date.current
        txns = household.transactions.where(date: date.beginning_of_month..date).where('amount_cents < 0')

        data = {
          month: date.strftime('%Y-%m'),
          total_spent: (txns.sum(:amount_cents).abs / 100.0).round(2),
          transaction_count: txns.count,
          updated_at: Time.current.iso8601
        }

        render_widget(data) { EmbedRenderer.spending_html(data, theme_param) }
      rescue ActiveRecord::RecordNotFound
        render_not_found
      end

      def budget
        share_token = ShareToken.active.find_by!(token: params[:token], widget_type: 'budget')
        household = share_token.user.household
        return render json: { error: 'No household' }, status: :not_found unless household

        month_str = params[:month] || Date.current.strftime('%Y-%m')
        month_date = Date.parse("#{month_str}-01")

        budget_record = household.budgets.find_by(is_active: true)
        items = budget_record ? budget_record.budget_items.where(month: month_date).includes(:category) : []

        total_budgeted = 0
        total_spent = 0
        categories = []

        items.each do |item|
          spent_cents = household.transactions
            .where(category: item.category)
            .where(date: month_date.beginning_of_month..month_date.end_of_month)
            .where('amount_cents < 0')
            .sum(:amount_cents).abs

          budgeted = (item.amount_cents / 100.0).round(2)
          spent = (spent_cents / 100.0).round(2)
          total_budgeted += budgeted
          total_spent += spent

          categories << {
            name: item.category&.name || 'Uncategorized',
            budgeted: budgeted,
            spent: spent,
            percent: budgeted > 0 ? ((spent / budgeted) * 100).round(0) : 0
          }
        end

        data = {
          month: month_str,
          total_budgeted: total_budgeted.round(2),
          total_spent: total_spent.round(2),
          remaining: (total_budgeted - total_spent).round(2),
          categories: categories.sort_by { |c| -c[:spent] }.first(8),
          updated_at: Time.current.iso8601
        }

        render_widget(data) { EmbedRenderer.budget_html(data, theme_param) }
      rescue ActiveRecord::RecordNotFound
        render_not_found
      end

      private

      def theme_param
        params[:theme]&.to_s == 'dark' ? 'dark' : 'light'
      end

      def html_request?
        request.format.html?
      end

      def render_widget(data)
        if html_request?
          render html: yield.html_safe, layout: false
        else
          render json: data
        end
      end

      def render_not_found
        if html_request?
          render html: EmbedRenderer.error_html('Invalid or expired share token').html_safe, layout: false, status: :not_found
        else
          render json: { error: 'Invalid or expired token' }, status: :not_found
        end
      end
    end
  end
end

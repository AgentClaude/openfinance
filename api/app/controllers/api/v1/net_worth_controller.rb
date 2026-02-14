module Api
  module V1
    class NetWorthController < BaseController
      def show
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        accounts = household.accounts.visible
        assets = accounts.assets.sum(:current_balance_cents)
        liabilities = accounts.liabilities.sum(:current_balance_cents)
        net_worth = assets - liabilities

        breakdown = accounts.ordered.map do |a|
          {
            id: a.id, name: a.name, type: a.account_type,
            balance_cents: a.current_balance_cents,
            balance: (a.current_balance_cents / 100.0).round(2),
            asset: a.asset?, liability: a.liability?
          }
        end

        render json: {
          net_worth_cents: net_worth, net_worth: (net_worth / 100.0).round(2),
          assets_cents: assets, assets: (assets / 100.0).round(2),
          liabilities_cents: liabilities, liabilities: (liabilities / 100.0).round(2),
          accounts: breakdown
        }
      end
    end
  end
end

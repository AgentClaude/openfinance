module Api
  module V1
    class AccountsController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        accounts = household.accounts.visible.ordered.map do |a|
          {
            id: a.id, name: a.name, type: a.account_type, subtype: a.account_subtype,
            balance_cents: a.current_balance_cents, balance: (a.current_balance_cents / 100.0).round(2),
            currency: a.currency, institution: a.connection&.institution_name,
            asset: a.asset?, liability: a.liability?,
            last_updated: a.last_updated&.iso8601
          }
        end

        render json: { accounts: accounts, count: accounts.size }
      end
    end
  end
end

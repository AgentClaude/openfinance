module Types
  class HoldingType < Types::BaseObject
    field :id, ID, null: false
    field :security, Types::SecurityType, null: false
    field :quantity, Float, null: false
    field :current_price, Float, null: true
    field :market_value, Float, null: true
    field :cost_basis, Float, null: true
    field :cost_basis_total, Float, null: false
    field :current_value, Float, null: false
    field :unrealized_gain_loss, Float, null: false
    field :unrealized_gain_loss_percentage, Float, null: false
    field :weight_in_account, Float, null: false
    field :as_of_date, String, null: false
    field :currency, String, null: false

    def current_price
      object.current_price_cents ? object.current_price_cents / 100.0 : nil
    end

    def market_value
      object.market_value_cents ? object.market_value_cents / 100.0 : nil
    end

    def cost_basis
      object.cost_basis_cents ? object.cost_basis_cents / 100.0 : nil
    end

    def cost_basis_total
      object.cost_basis_total.cents / 100.0
    end

    def current_value
      object.current_value.cents / 100.0
    end

    def unrealized_gain_loss
      object.unrealized_gain_loss.cents / 100.0
    end

    def unrealized_gain_loss_percentage
      object.unrealized_gain_loss_percentage
    end

    def weight_in_account
      # Calculate weight using Ruby to avoid DB column issues
      account_holdings = Holding.where(account_id: object.account_id, as_of_date: object.as_of_date).where('quantity > 0')
      total = account_holdings.sum { |h| (h.quantity * (h.current_price_cents || 0)).to_i }
      return 0.0 if total.zero?
      (object.current_value.cents.to_f / total * 100).round(2)
    end

    def as_of_date
      object.as_of_date.iso8601
    end
  end
end

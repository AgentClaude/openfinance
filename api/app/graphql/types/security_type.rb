module Types
  class SecurityType < Types::BaseObject
    field :id, ID, null: false
    field :symbol, String, null: false
    field :name, String, null: false
    field :security_type, String, null: true
    field :exchange, String, null: true
    field :currency, String, null: false
    field :current_price, Float, null: true

    def current_price
      latest = object.holdings.order(as_of_date: :desc).first
      latest&.current_price_cents ? latest.current_price_cents / 100.0 : nil
    end
  end
end

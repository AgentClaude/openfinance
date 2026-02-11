class CreateHoldings < ActiveRecord::Migration[7.0]
  def change
    create_table :holdings, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :security, null: false, foreign_key: true, type: :uuid
      
      t.decimal :quantity, precision: 20, scale: 8, null: false
      t.bigint :current_price_cents
      t.bigint :market_value_cents
      t.bigint :cost_basis_cents
      t.string :currency, default: 'USD'
      
      t.date :as_of_date, null: false
      t.string :plaid_holding_id

      t.timestamps null: false
    end
    add_index :holdings, :as_of_date
    add_index :holdings, :plaid_holding_id, unique: true
    add_index :holdings, [:account_id, :security_id, :as_of_date], unique: true, name: 'index_holdings_unique'
  end
end
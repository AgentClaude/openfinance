class CreateInvestmentTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :investment_transactions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :security, null: false, foreign_key: true, type: :uuid
      t.string :transaction_type, null: false  # dividend, buy, sell, interest, fee, capital_gain
      t.bigint :amount_cents, null: false, default: 0
      t.string :currency, null: false, default: 'USD'
      t.decimal :quantity, precision: 20, scale: 8  # shares involved (for buy/sell)
      t.bigint :price_cents  # price per share at time of transaction
      t.date :date, null: false
      t.string :description
      t.string :plaid_investment_transaction_id
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :investment_transactions, :transaction_type
    add_index :investment_transactions, :date
    add_index :investment_transactions, :plaid_investment_transaction_id, unique: true, name: 'idx_inv_txn_plaid_id'
    add_index :investment_transactions, [:account_id, :security_id, :date], name: 'idx_inv_txn_acct_sec_date'
  end
end

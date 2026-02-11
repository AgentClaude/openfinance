class CreateTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :transactions, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :category, null: true, foreign_key: true, type: :uuid
      
      t.date :date, null: false
      t.bigint :amount_cents, null: false
      t.string :currency, default: 'USD', null: false
      
      t.string :name, null: false
      t.string :merchant_name
      t.text :notes
      
      t.boolean :is_pending, default: false, null: false
      t.boolean :needs_review, default: false, null: false
      t.boolean :is_recurring, default: false, null: false
      
      t.string :plaid_transaction_id
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :transactions, :date
    add_index :transactions, :amount_cents
    add_index :transactions, :name
    add_index :transactions, :merchant_name
    add_index :transactions, :is_pending
    add_index :transactions, :needs_review
    add_index :transactions, :is_recurring
    add_index :transactions, :plaid_transaction_id, unique: true
    add_index :transactions, [:household_id, :date]
    add_index :transactions, [:account_id, :date]
    add_index :transactions, :metadata, using: :gin
  end
end
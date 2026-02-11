class CreateAccountBalanceHistories < ActiveRecord::Migration[7.0]
  def change
    create_table :account_balance_histories, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      
      t.date :date, null: false
      t.bigint :current_balance_cents, null: false
      t.bigint :available_balance_cents
      t.bigint :credit_limit_cents
      t.string :currency, default: 'USD', null: false

      t.timestamps null: false
    end
    add_index :account_balance_histories, :date
    add_index :account_balance_histories, [:account_id, :date], unique: true
  end
end
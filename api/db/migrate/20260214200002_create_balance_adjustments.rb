class CreateBalanceAdjustments < ActiveRecord::Migration[7.0]
  def change
    create_table :balance_adjustments, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :created_by, null: true, foreign_key: { to_table: :users }, type: :uuid
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: 'USD'
      t.date :adjusted_at, null: false
      t.text :notes

      t.timestamps
    end

    add_index :balance_adjustments, [:account_id, :adjusted_at]
  end
end

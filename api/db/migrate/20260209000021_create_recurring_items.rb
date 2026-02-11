class CreateRecurringItems < ActiveRecord::Migration[7.0]
  def change
    create_table :recurring_items, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :category, null: true, foreign_key: true, type: :uuid
      t.references :account, null: true, foreign_key: true, type: :uuid
      
      t.string :name, null: false
      t.text :description
      t.string :item_type, null: false # income, expense, transfer
      t.bigint :amount_cents, null: false
      t.string :currency, default: 'USD'
      
      t.string :frequency, null: false # daily, weekly, monthly, yearly
      t.integer :frequency_interval, default: 1 # every N periods
      t.date :start_date, null: false
      t.date :end_date
      t.date :next_occurrence
      
      t.boolean :is_active, default: true, null: false
      t.boolean :auto_create_transactions, default: false
      
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :recurring_items, :item_type
    add_index :recurring_items, :frequency
    add_index :recurring_items, :start_date
    add_index :recurring_items, :end_date
    add_index :recurring_items, :next_occurrence
    add_index :recurring_items, :is_active
    add_index :recurring_items, :metadata, using: :gin
  end
end
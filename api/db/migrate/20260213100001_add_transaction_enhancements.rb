class AddTransactionEnhancements < ActiveRecord::Migration[7.1]
  def change
    safety_assured do
      add_column :transactions, :parent_transaction_id, :uuid, null: true, if_not_exists: true
      add_column :transactions, :is_split, :boolean, default: false, null: false, if_not_exists: true
      add_column :transactions, :excluded, :boolean, default: false, null: false, if_not_exists: true
      add_column :transactions, :reviewed_at, :datetime, null: true, if_not_exists: true
      add_column :transactions, :transfer_pair_id, :uuid, null: true, if_not_exists: true
      add_column :transactions, :is_transfer, :boolean, default: false, null: false, if_not_exists: true

      add_index :transactions, :parent_transaction_id, if_not_exists: true
      add_index :transactions, :transfer_pair_id, if_not_exists: true
      add_index :transactions, :is_transfer, if_not_exists: true
      add_index :transactions, :excluded, if_not_exists: true

      create_table :csv_imports, id: :uuid, default: -> { "gen_random_uuid()" }, if_not_exists: true do |t|
        t.uuid :household_id, null: false
        t.uuid :account_id, null: false
        t.string :filename, null: false
        t.string :status, default: "pending", null: false
        t.integer :total_rows, default: 0
        t.integer :imported_rows, default: 0
        t.integer :skipped_rows, default: 0
        t.jsonb :column_mapping, default: {}
        t.jsonb :errors_log, default: []
        t.timestamps
      end

      add_index :csv_imports, :household_id, if_not_exists: true
      add_index :csv_imports, :account_id, if_not_exists: true
    end
  end
end

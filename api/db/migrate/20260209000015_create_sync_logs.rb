class CreateSyncLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :sync_logs, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :account_connection, null: false, foreign_key: true, type: :uuid
      
      t.string :sync_type, null: false # full, incremental, manual
      t.string :status, null: false # pending, success, error
      t.datetime :started_at, null: false
      t.datetime :completed_at
      
      t.integer :transactions_added, default: 0
      t.integer :transactions_updated, default: 0
      t.integer :accounts_updated, default: 0
      
      t.text :error_message
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :sync_logs, :sync_type
    add_index :sync_logs, :status
    add_index :sync_logs, :started_at
    add_index :sync_logs, :completed_at
    add_index :sync_logs, :metadata, using: :gin
  end
end
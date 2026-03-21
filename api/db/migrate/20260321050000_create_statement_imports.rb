class CreateStatementImports < ActiveRecord::Migration[8.0]
  def change
    create_table :statement_imports, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :household_id, null: false
      t.uuid :account_id, null: false
      t.string :filename, null: false
      t.string :format_type, null: false, default: "ofx" # ofx, qfx
      t.string :status, null: false, default: "pending"   # pending, processing, completed, failed
      t.integer :total_rows, default: 0
      t.integer :imported_rows, default: 0
      t.integer :skipped_rows, default: 0
      t.jsonb :metadata, default: {}
      t.jsonb :errors_log, default: []
      t.timestamps
    end

    add_index :statement_imports, :household_id
    add_index :statement_imports, :account_id

    # strong_migrations: add FK without validation, then validate separately
    add_foreign_key :statement_imports, :households, validate: false
    add_foreign_key :statement_imports, :accounts, validate: false
  end
end

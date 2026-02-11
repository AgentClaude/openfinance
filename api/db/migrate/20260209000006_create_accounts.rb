class CreateAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :accounts, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :connection, null: true, foreign_key: { to_table: :account_connections }, type: :uuid
      
      t.string :name, null: false
      t.string :account_type, null: false
      t.string :account_subtype
      t.string :official_name
      t.string :mask
      t.string :plaid_account_id
      
      # Balance fields in cents
      t.bigint :current_balance_cents, default: 0
      t.bigint :available_balance_cents
      t.bigint :credit_limit_cents
      t.string :currency, default: 'USD', null: false
      
      # Display and organization
      t.boolean :is_manual, default: false, null: false
      t.boolean :is_hidden, default: false, null: false
      t.integer :display_order, default: 0
      
      # Metadata
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :accounts, :account_type
    add_index :accounts, :account_subtype
    add_index :accounts, :plaid_account_id, unique: true
    add_index :accounts, :is_manual
    add_index :accounts, :is_hidden
    add_index :accounts, :display_order
    add_index :accounts, :metadata, using: :gin
    add_index :accounts, [:household_id, :display_order]
  end
end
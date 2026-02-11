class CreateAccountConnections < ActiveRecord::Migration[7.0]
  def change
    create_table :account_connections, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :institution, null: false, foreign_key: true, type: :uuid
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :uuid
      
      t.string :provider, null: false, default: 'plaid'
      t.string :status, null: false, default: 'pending'
      t.string :provider_connection_id
      t.text :provider_access_token
      t.string :error_code
      t.text :error_message
      t.datetime :last_synced_at
      t.datetime :consent_expires_at
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :account_connections, :provider
    add_index :account_connections, :status
    add_index :account_connections, :provider_connection_id
    add_index :account_connections, :last_synced_at
    add_index :account_connections, :consent_expires_at
    add_index :account_connections, :metadata, using: :gin
  end
end
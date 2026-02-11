class AddSyncCursorToAccountConnections < ActiveRecord::Migration[7.0]
  def change
    add_column :account_connections, :sync_cursor, :string
  end
end

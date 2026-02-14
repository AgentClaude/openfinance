class AddDeletedAtToUsers < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_column :users, :deleted_at, :datetime, null: true, if_not_exists: true
    add_index :users, :deleted_at, algorithm: :concurrently, if_not_exists: true
  end
end

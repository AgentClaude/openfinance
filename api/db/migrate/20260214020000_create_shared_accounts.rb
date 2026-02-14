class CreateSharedAccounts < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    create_table :shared_accounts, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :account_id, null: false
      t.uuid :shared_with_user_id, null: false
      t.uuid :shared_by_user_id, null: false
      t.string :permission_level, null: false, default: 'view'

      t.timestamps
    end

    add_index :shared_accounts, [:account_id, :shared_with_user_id], unique: true
    add_index :shared_accounts, :shared_with_user_id
    add_index :shared_accounts, :shared_by_user_id
    safety_assured do
      add_foreign_key :shared_accounts, :accounts, validate: false
      add_foreign_key :shared_accounts, :users, column: :shared_with_user_id, validate: false
      add_foreign_key :shared_accounts, :users, column: :shared_by_user_id, validate: false
    end
  end
end

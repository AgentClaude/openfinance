class CreateApiKeys < ActiveRecord::Migration[8.0]
  def change
    create_table :api_keys, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.string :key, null: false
      t.string :name, null: false
      t.datetime :last_used_at
      t.datetime :revoked_at

      t.timestamps
    end

    add_index :api_keys, :key, unique: true
    add_index :api_keys, :user_id
  end
end

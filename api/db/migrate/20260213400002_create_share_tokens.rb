class CreateShareTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :share_tokens, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.string :token, null: false
      t.string :widget_type, null: false
      t.jsonb :config, default: {}
      t.datetime :expires_at

      t.timestamps
    end

    add_index :share_tokens, :token, unique: true
    add_index :share_tokens, :widget_type
    add_index :share_tokens, :user_id
  end
end

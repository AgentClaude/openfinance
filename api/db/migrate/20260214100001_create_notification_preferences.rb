class CreateNotificationPreferences < ActiveRecord::Migration[7.1]
  def change
    create_table :notification_preferences, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :notification_type, null: false
      t.string :channel, null: false, default: 'in_app'
      t.boolean :enabled, null: false, default: true

      t.timestamps
    end

    add_index :notification_preferences, [:user_id, :notification_type, :channel], unique: true, name: 'idx_notif_prefs_user_type_channel'
  end
end

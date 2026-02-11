class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      
      t.string :title, null: false
      t.text :body
      t.string :notification_type, null: false # budget_alert, transaction_alert, sync_error, etc
      t.string :priority, default: 'normal', null: false # low, normal, high
      
      t.boolean :is_read, default: false, null: false
      t.datetime :read_at
      t.datetime :scheduled_for
      
      t.jsonb :data, default: {}
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :notifications, :notification_type
    add_index :notifications, :priority
    add_index :notifications, :is_read
    add_index :notifications, :read_at
    add_index :notifications, :scheduled_for
    add_index :notifications, :created_at
    add_index :notifications, :data, using: :gin
    add_index :notifications, :metadata, using: :gin
  end
end
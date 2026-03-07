class RebuildWebhookTables < ActiveRecord::Migration[8.0]
  def up
    # Drop old tables (empty, from a stale branch)
    drop_table :webhook_deliveries, if_exists: true
    drop_table :webhook_subscriptions, if_exists: true

    create_table :webhook_subscriptions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.string :url, null: false
      t.string :secret, null: false
      t.string :name, null: false
      t.string :events, array: true, default: [], null: false
      t.boolean :is_active, default: true, null: false
      t.datetime :last_triggered_at
      t.integer :failure_count, default: 0, null: false
      t.datetime :disabled_at
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:household_id, :is_active]
      t.index :url
    end

    create_table :webhook_events, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :webhook_subscription, null: false, foreign_key: true, type: :uuid
      t.string :event_type, null: false
      t.jsonb :payload, default: {}, null: false
      t.integer :status_code
      t.text :response_body
      t.float :response_time_ms
      t.string :delivery_status, null: false, default: "pending"
      t.integer :attempt, default: 1, null: false
      t.text :error_message
      t.datetime :delivered_at
      t.datetime :created_at, null: false

      t.index [:webhook_subscription_id, :created_at]
      t.index :event_type
      t.index :delivery_status
    end
  end

  def down
    drop_table :webhook_events, if_exists: true
    drop_table :webhook_subscriptions, if_exists: true
  end
end

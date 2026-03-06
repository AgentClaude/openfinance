class CreateWebhookSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :webhook_subscriptions do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :url, null: false
      t.string :secret, null: false
      t.string :events, array: true, default: []
      t.boolean :is_active, default: true, null: false
      t.integer :failure_count, default: 0, null: false
      t.datetime :last_triggered_at
      t.datetime :last_failed_at
      t.string :last_error
      t.timestamps
    end

    create_table :webhook_deliveries do |t|
      t.references :webhook_subscription, null: false, foreign_key: true
      t.string :event_type, null: false
      t.jsonb :payload, default: {}
      t.integer :response_code
      t.string :response_body, limit: 1000
      t.boolean :success, default: false, null: false
      t.integer :duration_ms
      t.datetime :delivered_at
      t.timestamps
    end

    add_index :webhook_subscriptions, [:user_id, :is_active]
    add_index :webhook_deliveries, [:webhook_subscription_id, :created_at]
  end
end

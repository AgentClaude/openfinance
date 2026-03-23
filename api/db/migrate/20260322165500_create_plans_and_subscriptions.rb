class CreatePlansAndSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :plans, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :stripe_price_id
      t.string :stripe_price_id_annual
      t.integer :price_cents, default: 0
      t.integer :annual_price_cents, default: 0
      t.string :currency, default: "USD"
      t.jsonb :features, default: {}
      t.integer :max_accounts, default: 2
      t.integer :max_transactions, default: 500
      t.boolean :has_reports, default: false
      t.boolean :has_budgets, default: false
      t.boolean :has_goals, default: false
      t.boolean :has_investments, default: false
      t.boolean :has_recurring, default: false
      t.boolean :has_csv_import, default: false
      t.boolean :has_api_access, default: false
      t.boolean :has_collaboration, default: false
      t.boolean :has_priority_support, default: false
      t.integer :position, default: 0
      t.boolean :is_active, default: true
      t.timestamps
      t.index :slug, unique: true
      t.index :stripe_price_id, unique: true, where: "stripe_price_id IS NOT NULL"
    end

    create_table :subscriptions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid, index: false
      t.references :plan, null: false, foreign_key: true, type: :uuid
      t.string :status, null: false, default: "trialing"
      t.string :stripe_customer_id
      t.string :stripe_subscription_id
      t.string :billing_interval, default: "monthly"
      t.datetime :trial_ends_at
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :canceled_at
      t.datetime :cancel_at
      t.boolean :cancel_at_period_end, default: false
      t.jsonb :metadata, default: {}
      t.timestamps
      t.index :stripe_customer_id, unique: true, where: "stripe_customer_id IS NOT NULL"
      t.index :stripe_subscription_id, unique: true, where: "stripe_subscription_id IS NOT NULL"
      t.index :household_id, unique: true
      t.index :status
    end
  end
end

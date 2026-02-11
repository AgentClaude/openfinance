class CreateNotificationRules < ActiveRecord::Migration[7.0]
  def change
    create_table :notification_rules, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      
      t.string :name, null: false
      t.string :rule_type, null: false # budget_exceeded, large_transaction, low_balance, etc
      t.boolean :is_active, default: true, null: false
      
      t.jsonb :conditions, default: {} # rule-specific conditions
      t.jsonb :settings, default: {} # notification settings
      
      t.timestamps null: false
    end
    add_index :notification_rules, :rule_type
    add_index :notification_rules, :is_active
    add_index :notification_rules, :conditions, using: :gin
    add_index :notification_rules, :settings, using: :gin
  end
end
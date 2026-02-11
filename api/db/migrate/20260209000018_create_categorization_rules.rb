class CreateCategorizationRules < ActiveRecord::Migration[7.0]
  def change
    create_table :categorization_rules, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :category, null: false, foreign_key: true, type: :uuid
      
      t.string :name, null: false
      t.string :rule_type, null: false # merchant_name, amount_range, description_contains
      t.jsonb :conditions, null: false # rule conditions
      t.integer :priority, default: 0 # higher priority rules run first
      t.boolean :is_active, default: true, null: false
      
      t.integer :matches_count, default: 0 # track how many times this rule has matched

      t.timestamps null: false
    end
    add_index :categorization_rules, :rule_type
    add_index :categorization_rules, :priority
    add_index :categorization_rules, :is_active
    add_index :categorization_rules, :conditions, using: :gin
    add_index :categorization_rules, [:household_id, :priority]
  end
end
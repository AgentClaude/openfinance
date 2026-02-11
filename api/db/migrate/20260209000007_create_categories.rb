class CreateCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :categories, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :parent, null: true, foreign_key: { to_table: :categories }, type: :uuid
      
      t.string :name, null: false
      t.string :group_name
      t.text :description
      t.string :color, default: '#6B7280'
      t.string :color_hex, default: '#6B7280'
      t.string :icon
      t.boolean :is_income, default: false, null: false
      t.boolean :is_system, default: false, null: false
      t.boolean :is_hidden, default: false, null: false
      t.boolean :is_active, default: true, null: false
      t.integer :display_order, default: 0
      
      t.jsonb :plaid_categories, default: []
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :categories, :name
    add_index :categories, :is_income
    add_index :categories, :is_system
    add_index :categories, :is_active
    add_index :categories, :display_order
    add_index :categories, [:household_id, :name], unique: true
    add_index :categories, [:household_id, :display_order]
    add_index :categories, :plaid_categories, using: :gin
    add_index :categories, :metadata, using: :gin
  end
end
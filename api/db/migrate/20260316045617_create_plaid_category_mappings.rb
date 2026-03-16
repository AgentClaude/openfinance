class CreatePlaidCategoryMappings < ActiveRecord::Migration[8.0]
  def change
    create_table :plaid_category_mappings, id: :uuid do |t|
      t.string :plaid_primary, null: false
      t.string :plaid_detailed
      t.references :category, type: :uuid, foreign_key: true, null: false
      t.references :household, type: :uuid, foreign_key: true, null: false
      t.boolean :is_default, default: false, null: false

      t.timestamps
    end

    add_index :plaid_category_mappings, [:household_id, :plaid_primary, :plaid_detailed],
              unique: true, name: 'idx_plaid_mappings_unique'
    add_index :plaid_category_mappings, :plaid_primary
  end
end

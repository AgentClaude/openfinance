class CreateMerchantNameMappings < ActiveRecord::Migration[8.0]
  def change
    create_table :merchant_name_mappings do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.string :raw_pattern, null: false
      t.string :clean_name, null: false
      t.string :match_type, null: false, default: 'contains'
      t.integer :applied_count, null: false, default: 0
      t.boolean :is_active, null: false, default: true
      t.timestamps
    end

    add_index :merchant_name_mappings, [:household_id, :raw_pattern, :match_type],
              unique: true, name: 'idx_merchant_mappings_unique'
  end
end

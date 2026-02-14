class CreateMerchantMappings < ActiveRecord::Migration[7.1]
  def change
    create_table :merchant_mappings, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.string :raw_pattern, null: false
      t.string :clean_name, null: false
      t.string :match_type, default: 'contains', null: false
      t.integer :applied_count, default: 0, null: false
      t.boolean :is_active, default: true, null: false
      t.timestamps
    end
    add_index :merchant_mappings, [:household_id, :raw_pattern], unique: true
    add_column :transactions, :raw_description, :string
  end
end

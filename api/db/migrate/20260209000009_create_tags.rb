class CreateTags < ActiveRecord::Migration[7.0]
  def change
    create_table :tags, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      
      t.string :name, null: false
      t.text :description
      t.string :color_hex, default: '#6B7280'
      t.boolean :is_active, default: true, null: false

      t.timestamps null: false
    end
    add_index :tags, :name
    add_index :tags, :is_active
    add_index :tags, [:household_id, :name], unique: true
  end
end
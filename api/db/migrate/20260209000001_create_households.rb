class CreateHouseholds < ActiveRecord::Migration[7.0]
  def change
    create_table :households, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.string :name, null: false
      t.text :description
      t.string :currency, default: 'USD', null: false
      t.string :timezone, default: 'America/New_York'
      t.jsonb :preferences, default: {}
      t.jsonb :metadata, default: {}
      t.boolean :is_active, default: true, null: false

      t.timestamps null: false
    end

    add_index :households, :name
    add_index :households, :is_active
    add_index :households, :preferences, using: :gin
    add_index :households, :metadata, using: :gin
  end
end
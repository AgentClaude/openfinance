class CreateInstitutions < ActiveRecord::Migration[7.0]
  def change
    create_table :institutions, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.string :name, null: false
      t.string :plaid_institution_id, unique: true
      t.string :website_url
      t.string :logo_url
      t.string :primary_color
      t.jsonb :supported_products, default: []
      t.jsonb :country_codes, default: []
      t.boolean :oauth_support, default: false
      t.boolean :is_active, default: true, null: false
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end

    add_index :institutions, :name
    add_index :institutions, :plaid_institution_id, unique: true
    add_index :institutions, :is_active
    add_index :institutions, :supported_products, using: :gin
    add_index :institutions, :country_codes, using: :gin
    add_index :institutions, :metadata, using: :gin
  end
end
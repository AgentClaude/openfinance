class CreateHouseholdMemberships < ActiveRecord::Migration[7.0]
  def change
    create_table :household_memberships, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false, default: 'member'
      t.boolean :is_active, default: true, null: false
      t.datetime :joined_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :left_at
      t.references :invited_by, foreign_key: { to_table: :users }, type: :uuid

      t.timestamps null: false
    end

    add_index :household_memberships, [:user_id, :household_id], unique: true, name: 'index_household_memberships_on_user_and_household'
    add_index :household_memberships, :role
    add_index :household_memberships, :is_active
  end
end
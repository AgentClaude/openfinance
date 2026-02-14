class CreateInvitations < ActiveRecord::Migration[8.0]
  def change
    create_table :invitations, id: :uuid do |t|
      t.string :email, null: false
      t.string :role, null: false, default: 'member'
      t.string :status, null: false, default: 'pending'
      t.string :token, null: false
      t.uuid :household_id, null: false
      t.uuid :invited_by_id, null: false
      t.datetime :accepted_at
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :invitations, :token, unique: true
    add_index :invitations, :household_id
    add_index :invitations, :invited_by_id
    add_index :invitations, [:email, :household_id], unique: true, where: "status = 'pending'"
    safety_assured do
      add_foreign_key :invitations, :households
      add_foreign_key :invitations, :users, column: :invited_by_id
    end
  end
end

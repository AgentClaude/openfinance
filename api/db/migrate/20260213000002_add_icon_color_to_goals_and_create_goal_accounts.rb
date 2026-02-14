class AddIconColorToGoalsAndCreateGoalAccounts < ActiveRecord::Migration[7.1]
  def change
    add_column :goals, :icon, :string, default: '🎯'
    add_column :goals, :color, :string, default: '#4ECDC4'

    create_table :goal_accounts, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :goal_id, null: false
      t.uuid :account_id, null: false
      t.timestamps
    end

    add_index :goal_accounts, [:goal_id, :account_id], unique: true
    add_index :goal_accounts, :account_id
    add_foreign_key :goal_accounts, :goals, validate: false
    add_foreign_key :goal_accounts, :accounts, validate: false
  end
end

class AddIconColorToGoals < ActiveRecord::Migration[8.0]
  def change
    add_column :goals, :icon, :string unless column_exists?(:goals, :icon)
    add_column :goals, :color, :string unless column_exists?(:goals, :color)

    unless table_exists?(:goal_accounts)
      create_table :goal_accounts, id: :uuid do |t|
        t.uuid :goal_id, null: false
        t.uuid :account_id, null: false
        t.timestamps
      end

      add_index :goal_accounts, :goal_id
      add_index :goal_accounts, :account_id
      add_index :goal_accounts, [:goal_id, :account_id], unique: true
      add_foreign_key :goal_accounts, :goals
      add_foreign_key :goal_accounts, :accounts
    end
  end
end

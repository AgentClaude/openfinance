class CreateGoalMilestones < ActiveRecord::Migration[8.0]
  def change
    create_table :goal_milestones, id: :uuid do |t|
      t.references :goal, null: false, foreign_key: true, type: :uuid
      t.integer :percentage, null: false # 25, 50, 75, 100
      t.bigint :amount_at_milestone_cents, null: false
      t.datetime :achieved_at, null: false

      t.timestamps
    end

    add_index :goal_milestones, [:goal_id, :percentage], unique: true
  end
end

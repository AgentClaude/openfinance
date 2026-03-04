class CreateActivityEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :activity_events, id: :uuid do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :action, null: false          # e.g. "categorized", "created", "updated", "deleted", "split", "invited", "joined"
      t.string :resource_type, null: false    # e.g. "Transaction", "BudgetItem", "Goal", "Invitation"
      t.uuid :resource_id                     # polymorphic ID (nullable if resource deleted)
      t.jsonb :metadata, default: {}          # extra context: { category_name: "Food", amount: 42.50, etc. }
      t.timestamps
    end

    add_index :activity_events, [:household_id, :created_at]
    add_index :activity_events, [:resource_type, :resource_id]
    add_index :activity_events, :action
  end
end

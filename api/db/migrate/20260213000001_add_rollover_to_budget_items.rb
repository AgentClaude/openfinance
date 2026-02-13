class AddRolloverToBudgetItems < ActiveRecord::Migration[8.0]
  def change
    add_column :budget_items, :rollover_cents, :integer, default: 0, null: false
  end
end

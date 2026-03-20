class AddFlexBudgetModeToBudgets < ActiveRecord::Migration[8.0]
  def change
    add_column :budgets, :budget_mode, :string, default: 'per_category', null: false
    add_column :budgets, :spending_target_cents, :integer, default: 0, null: false
    safety_assured { add_index :budgets, :budget_mode }
  end
end

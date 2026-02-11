class CreateBudgets < ActiveRecord::Migration[7.0]
  def change
    create_table :budgets, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      
      t.string :name, null: false
      t.text :description
      t.date :start_date, null: false
      t.date :end_date
      t.boolean :is_active, default: true, null: false
      t.string :period_type, default: 'monthly', null: false # monthly, weekly, yearly

      t.timestamps null: false
    end
    add_index :budgets, :start_date
    add_index :budgets, :end_date
    add_index :budgets, :is_active
    add_index :budgets, :period_type
    add_index :budgets, [:household_id, :name], unique: true
  end
end
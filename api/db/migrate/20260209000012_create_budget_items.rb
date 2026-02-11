class CreateBudgetItems < ActiveRecord::Migration[7.0]
  def change
    create_table :budget_items, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :budget, null: false, foreign_key: true, type: :uuid
      t.references :category, null: false, foreign_key: true, type: :uuid
      
      t.date :month, null: false
      t.bigint :amount_cents, null: false, default: 0
      t.string :currency, default: 'USD', null: false
      t.text :notes

      t.timestamps null: false
    end
    add_index :budget_items, :month
    add_index :budget_items, [:budget_id, :category_id, :month], unique: true, name: 'index_budget_items_unique'
  end
end
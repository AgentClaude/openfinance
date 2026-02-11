class CreateGoals < ActiveRecord::Migration[7.0]
  def change
    create_table :goals, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :household, null: false, foreign_key: true, type: :uuid
      t.references :target_account, null: true, foreign_key: { to_table: :accounts }, type: :uuid
      
      t.string :name, null: false
      t.text :description
      t.string :goal_type, null: false # savings, debt_payoff, investment
      t.bigint :target_amount_cents, null: false
      t.bigint :current_amount_cents, default: 0
      t.string :currency, default: 'USD', null: false
      
      t.date :target_date
      t.date :start_date, null: false, default: -> { 'CURRENT_DATE' }
      t.boolean :is_active, default: true, null: false
      t.boolean :is_achieved, default: false, null: false
      t.datetime :achieved_at
      
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end
    add_index :goals, :goal_type
    add_index :goals, :target_date
    add_index :goals, :start_date
    add_index :goals, :is_active
    add_index :goals, :is_achieved
    add_index :goals, :achieved_at
    add_index :goals, :metadata, using: :gin
  end
end
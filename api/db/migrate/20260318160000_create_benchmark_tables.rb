class CreateBenchmarkTables < ActiveRecord::Migration[8.0]
  def change
    create_table :benchmark_indices, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :symbol, null: false
      t.string :name, null: false
      t.string :description
      t.string :currency, null: false, default: "USD"
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :benchmark_indices, :symbol, unique: true

    create_table :benchmark_data_points, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :benchmark_index, null: false, foreign_key: true, type: :uuid
      t.date :date, null: false
      t.decimal :close_price, precision: 12, scale: 2, null: false
      t.timestamps
    end

    add_index :benchmark_data_points, [:benchmark_index_id, :date], unique: true, name: "idx_benchmark_data_points_on_index_and_date"
  end
end

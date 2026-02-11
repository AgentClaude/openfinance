class CreateTransactionTags < ActiveRecord::Migration[7.0]
  def change
    create_table :transaction_tags, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :transaction, null: false, foreign_key: true, type: :uuid
      t.references :tag, null: false, foreign_key: true, type: :uuid

      t.timestamps null: false
    end

    add_index :transaction_tags, [:transaction_id, :tag_id], unique: true
  end
end
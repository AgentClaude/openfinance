class CreateSecurities < ActiveRecord::Migration[7.0]
  def change
    create_table :securities, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.string :symbol, null: false
      t.string :name, null: false
      t.string :security_type # stock, bond, mutual_fund, etf, etc
      t.string :exchange
      t.string :currency, default: 'USD'
      
      t.string :plaid_security_id
      t.string :cusip
      t.string :isin
      t.string :sedol
      
      t.jsonb :metadata, default: {}

      t.timestamps null: false
    end

    add_index :securities, :symbol
    add_index :securities, :name
    add_index :securities, :security_type
    add_index :securities, :plaid_security_id, unique: true
    add_index :securities, :cusip
    add_index :securities, :isin
    add_index :securities, :metadata, using: :gin
  end
end
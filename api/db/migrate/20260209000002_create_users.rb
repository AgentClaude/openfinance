class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users, id: :uuid, default: 'gen_random_uuid()' do |t|
      # Devise fields
      t.string :email, null: false, default: ''
      t.string :encrypted_password, null: false, default: ''
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at
      t.integer :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string :current_sign_in_ip
      t.string :last_sign_in_ip
      t.string :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at
      t.string :unconfirmed_email
      t.integer :failed_attempts, default: 0, null: false
      t.string :unlock_token
      t.datetime :locked_at

      # JWT fields
      t.string :jti, null: false

      # Custom fields
      t.string :name, null: false
      t.string :role, default: 'owner', null: false
      t.references :household, foreign_key: true, type: :uuid
      t.jsonb :preferences, default: {}
      t.string :two_factor_secret
      t.boolean :two_factor_enabled, default: false, null: false
      t.text :avatar

      t.timestamps null: false
    end

    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :confirmation_token, unique: true
    add_index :users, :unlock_token, unique: true
    add_index :users, :jti, unique: true
    add_index :users, :role
    add_index :users, :preferences, using: :gin
  end
end
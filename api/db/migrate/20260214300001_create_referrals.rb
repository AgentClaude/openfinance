class CreateReferrals < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_column :users, :referral_code, :string, if_not_exists: true
    add_index :users, :referral_code, unique: true, algorithm: :concurrently, if_not_exists: true

    safety_assured do
      create_table :referrals, id: :uuid, default: -> { "gen_random_uuid()" }, if_not_exists: true do |t|
        t.references :referrer, null: false, foreign_key: { to_table: :users, validate: false }, type: :uuid
        t.references :referred_user, null: false, foreign_key: { to_table: :users, validate: false }, type: :uuid
        t.string :referral_code, null: false
        t.string :status, null: false, default: 'pending'
        t.datetime :rewarded_at

        t.timestamps
      end
    end

    add_index :referrals, :referral_code, algorithm: :concurrently, if_not_exists: true
    add_index :referrals, [:referrer_id, :referred_user_id], unique: true, algorithm: :concurrently, if_not_exists: true
  end
end

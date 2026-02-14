class CreateReferrals < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :referral_code, :string
    add_index :users, :referral_code, unique: true

    create_table :referrals, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :referrer, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.references :referred_user, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.string :referral_code, null: false
      t.string :status, null: false, default: 'pending'
      t.datetime :rewarded_at

      t.timestamps
    end

    add_index :referrals, :referral_code
    add_index :referrals, [:referrer_id, :referred_user_id], unique: true
  end
end

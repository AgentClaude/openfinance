class AddReferralClicksToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :referral_clicks, :integer, default: 0, null: false
  end
end

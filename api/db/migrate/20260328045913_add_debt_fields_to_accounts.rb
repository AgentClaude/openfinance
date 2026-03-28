class AddDebtFieldsToAccounts < ActiveRecord::Migration[8.0]
  def change
    add_column :accounts, :interest_rate, :decimal, precision: 5, scale: 2
    add_column :accounts, :minimum_payment_cents, :integer, default: 0
  end
end

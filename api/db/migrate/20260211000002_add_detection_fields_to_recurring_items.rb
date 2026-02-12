class AddDetectionFieldsToRecurringItems < ActiveRecord::Migration[7.0]
  def change
    add_column :recurring_items, :merchant_name, :string unless column_exists?(:recurring_items, :merchant_name)
    add_column :recurring_items, :is_income, :boolean, default: false unless column_exists?(:recurring_items, :is_income)
    add_column :recurring_items, :is_auto_detected, :boolean, default: false unless column_exists?(:recurring_items, :is_auto_detected)
    add_column :recurring_items, :last_occurrence, :date unless column_exists?(:recurring_items, :last_occurrence)
    add_column :recurring_items, :occurrence_count, :integer, default: 0 unless column_exists?(:recurring_items, :occurrence_count)
    add_column :recurring_items, :average_amount_cents, :integer unless column_exists?(:recurring_items, :average_amount_cents)
    add_column :recurring_items, :amount_variance_cents, :integer, default: 0 unless column_exists?(:recurring_items, :amount_variance_cents)
  end
end

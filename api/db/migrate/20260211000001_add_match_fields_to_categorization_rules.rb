class AddMatchFieldsToCategorizationRules < ActiveRecord::Migration[7.0]
  def change
    add_column :categorization_rules, :match_field, :string, default: 'merchant_name' unless column_exists?(:categorization_rules, :match_field)
    add_column :categorization_rules, :match_type, :string, default: 'contains' unless column_exists?(:categorization_rules, :match_type)
    add_column :categorization_rules, :match_value, :string unless column_exists?(:categorization_rules, :match_value)
    add_column :categorization_rules, :rename_to, :string unless column_exists?(:categorization_rules, :rename_to)
  end
end

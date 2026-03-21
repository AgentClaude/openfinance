class ValidateStatementImportsForeignKeys < ActiveRecord::Migration[8.0]
  def change
    validate_foreign_key :statement_imports, :households
    validate_foreign_key :statement_imports, :accounts
  end
end

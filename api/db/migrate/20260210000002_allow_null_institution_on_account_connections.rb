class AllowNullInstitutionOnAccountConnections < ActiveRecord::Migration[7.0]
  def change
    change_column_null :account_connections, :institution_id, true
  end
end

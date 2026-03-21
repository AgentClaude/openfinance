class AddOfxFitIdIndexToTransactions < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_index :transactions, "(metadata->>'ofx_fit_id')",
      name: "index_transactions_on_ofx_fit_id",
      where: "metadata->>'ofx_fit_id' IS NOT NULL",
      algorithm: :concurrently
  end
end

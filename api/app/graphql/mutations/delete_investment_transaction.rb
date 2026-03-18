module Mutations
  class DeleteInvestmentTransaction < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!

      txn = InvestmentTransaction.joins(:account)
              .where(accounts: { household_id: hh.id })
              .find(id)

      authorize(txn, :destroy?)
      txn.destroy!

      { success: true }
    end
  end
end

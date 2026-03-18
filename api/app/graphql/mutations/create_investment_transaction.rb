module Mutations
  class CreateInvestmentTransaction < BaseMutation
    argument :account_id, ID, required: true
    argument :security_id, ID, required: true
    argument :transaction_type, String, required: true
    argument :amount, Float, required: true
    argument :date, String, required: true
    argument :quantity, Float, required: false
    argument :price, Float, required: false
    argument :description, String, required: false

    type Types::InvestmentTransactionType

    def resolve(**args)
      hh = require_auth!

      account = hh.accounts.find(args[:account_id])
      security = Security.find(args[:security_id])

      txn = InvestmentTransaction.new(
        account: account,
        security: security,
        transaction_type: args[:transaction_type],
        amount_cents: (args[:amount] * 100).to_i,
        date: Date.parse(args[:date]),
        quantity: args[:quantity],
        price_cents: args[:price] ? (args[:price] * 100).to_i : nil,
        description: args[:description]
      )

      authorize(txn, :create?)
      txn.save!
      log_activity(action: 'investment_transaction_created', resource: txn, metadata: {
        type: txn.transaction_type,
        security: security.symbol,
        amount: args[:amount]
      })
      txn
    end
  end
end

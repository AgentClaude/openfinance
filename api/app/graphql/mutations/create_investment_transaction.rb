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

      result = InvestmentTransactions::CreateService.call(
        household: hh,
        account_id: args[:account_id],
        security_id: args[:security_id],
        transaction_type: args[:transaction_type],
        amount: args[:amount],
        date: args[:date],
        quantity: args[:quantity],
        price: args[:price],
        description: args[:description]
      )

      if result.success?
        txn = result.data[:investment_transaction]
        log_activity(action: 'investment_transaction_created', resource: txn, metadata: {
          type: txn.transaction_type,
          security: txn.security.symbol,
          amount: args[:amount]
        })
        txn
      else
        raise GraphQL::ExecutionError, result.error_message
      end
    end
  end
end

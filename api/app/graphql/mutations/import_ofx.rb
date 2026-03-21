module Mutations
  class ImportOfx < BaseMutation
    argument :account_id, ID, required: true
    argument :file_content, String, required: true
    argument :filename, String, required: false, default_value: "import.ofx"
    argument :update_balance, Boolean, required: false, default_value: false

    field :imported, Integer, null: false
    field :skipped, Integer, null: false
    field :errors, [String], null: true
    field :import_id, ID, null: true
    field :account_info, GraphQL::Types::JSON, null: true
    field :balance, GraphQL::Types::JSON, null: true
    field :date_range, GraphQL::Types::JSON, null: true

    def resolve(account_id:, file_content:, filename:, update_balance:)
      hh = require_auth!

      result = Transactions::OfxImportService.new(
        household: hh,
        account_id: account_id,
        file_content: file_content,
        filename: filename,
        update_balance: update_balance
      ).call

      if result.success?
        {
          imported: result.data[:imported],
          skipped: result.data[:skipped],
          errors: result.data[:errors].map { |e| "Row #{e[:row]}: #{e[:error]}" },
          import_id: result.data[:statement_import]&.id,
          account_info: result.data[:account_info],
          balance: result.data[:balance],
          date_range: result.data[:date_range]
        }
      else
        { imported: 0, skipped: 0, errors: [result.error_message], import_id: nil,
          account_info: nil, balance: nil, date_range: nil }
      end
    end
  end
end

module Mutations
  class ImportCsv < BaseMutation
    argument :account_id, ID, required: true
    argument :csv_content, String, required: true
    argument :filename, String, required: false, default_value: "import.csv"
    argument :column_mapping, GraphQL::Types::JSON, required: false
    argument :format_type, String, required: false, default_value: "auto"

    field :imported, Integer, null: false
    field :skipped, Integer, null: false
    field :errors, [String], null: true
    field :import_id, ID, null: true

    def resolve(account_id:, csv_content:, filename:, column_mapping: nil, format_type: "auto")
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      result = Transactions::CsvImportService.new(
        household: household,
        account_id: account_id,
        csv_content: csv_content,
        column_mapping: column_mapping,
        filename: filename,
        format_type: format_type
      ).call

      if result.success?
        {
          imported: result.data[:imported],
          skipped: result.data[:skipped],
          errors: result.data[:errors].map { |e| "Row #{e[:row]}: #{e[:error]}" },
          import_id: result.data[:csv_import]&.id
        }
      else
        { imported: 0, skipped: 0, errors: [result.error_message], import_id: nil }
      end
    end
  end
end

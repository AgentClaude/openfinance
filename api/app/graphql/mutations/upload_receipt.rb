module Mutations
  class UploadReceipt < BaseMutation
    argument :transaction_id, ID, required: true
    argument :file_data, String, required: true, description: "Base64-encoded file content"
    argument :filename, String, required: true
    argument :content_type, String, required: false, default_value: "application/octet-stream"

    field :transaction, Types::TransactionType, null: true
    field :errors, [String], null: false

    def resolve(transaction_id:, file_data:, filename:, content_type:)
      user = context[:current_user]
      return { transaction: nil, errors: ['Not authenticated'] } unless user&.household

      transaction = TransactionPolicy::Scope.new(user, Transaction).resolve.find_by(id: transaction_id)
      return { transaction: nil, errors: ['Transaction not found'] } unless transaction

      decoded = Base64.decode64(file_data)
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(decoded),
        filename: filename,
        content_type: content_type
      )
      transaction.receipt.attach(blob)

      { transaction: transaction, errors: [] }
    rescue StandardError => e
      { transaction: nil, errors: [e.message] }
    end
  end
end

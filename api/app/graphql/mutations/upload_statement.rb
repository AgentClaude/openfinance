module Mutations
  class UploadStatement < BaseMutation
    argument :account_id, ID, required: true
    argument :file_data, String, required: true, description: "Base64-encoded file content"
    argument :filename, String, required: true
    argument :content_type, String, required: false, default_value: "application/octet-stream"

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(account_id:, file_data:, filename:, content_type:)
      user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless user&.household

      account = AccountPolicy::Scope.new(user, Account).resolve.find_by(id: account_id)
      return { success: false, errors: ['Account not found'] } unless account

      decoded = Base64.decode64(file_data)
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(decoded),
        filename: filename,
        content_type: content_type
      )
      account.statements.attach(blob)

      { success: true, errors: [] }
    rescue StandardError => e
      { success: false, errors: [e.message] }
    end
  end
end

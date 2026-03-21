module Mutations
  class PreviewOfx < BaseMutation
    argument :file_content, String, required: true

    field :transactions, [GraphQL::Types::JSON], null: false
    field :total_count, Integer, null: false
    field :account, GraphQL::Types::JSON, null: true
    field :balance, GraphQL::Types::JSON, null: true
    field :date_range, GraphQL::Types::JSON, null: true
    field :is_credit_card, Boolean, null: false
    field :error, String, null: true

    def resolve(file_content:)
      require_auth!

      preview = Transactions::OfxImportService.preview(file_content: file_content)
      {
        transactions: preview[:transactions],
        total_count: preview[:total_count],
        account: preview[:account],
        balance: preview[:balance],
        date_range: preview[:date_range],
        is_credit_card: preview[:is_credit_card],
        error: nil
      }
    rescue Transactions::OfxParser::ParseError => e
      {
        transactions: [],
        total_count: 0,
        account: nil,
        balance: nil,
        date_range: nil,
        is_credit_card: false,
        error: e.message
      }
    end
  end
end

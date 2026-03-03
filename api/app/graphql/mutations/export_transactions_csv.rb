require 'csv'

module Mutations
  class ExportTransactionsCsv < BaseMutation
    argument :start_date, String, required: false
    argument :end_date, String, required: false
    argument :account_ids, [ID], required: false
    argument :category_ids, [ID], required: false

    field :csv_data, String, null: false
    field :filename, String, null: false

    def resolve(start_date: nil, end_date: nil, account_ids: nil, category_ids: nil)
      hh = require_auth!

      scope = hh.transactions.includes(:category, :account, :tags).order(date: :desc)
      scope = scope.where('date >= ?', Date.parse(start_date)) if start_date.present?
      scope = scope.where('date <= ?', Date.parse(end_date)) if end_date.present?
      scope = scope.where(account_id: account_ids) if account_ids.present?
      scope = scope.where(category_id: category_ids) if category_ids.present?

      csv_string = CSV.generate do |csv|
        csv << ['Date', 'Description', 'Merchant', 'Category', 'Account', 'Amount', 'Tags', 'Notes', 'Pending', 'Excluded']

        scope.find_each do |txn|
          csv << [
            txn.date&.iso8601,
            txn.name || txn.description,
            txn.merchant_name,
            txn.category&.name,
            txn.account&.name,
            '%.2f' % (txn.amount_cents / 100.0),
            txn.tags.map(&:name).join('; '),
            txn.notes,
            txn.pending? ? 'Yes' : 'No',
            txn.try(:excluded) ? 'Yes' : 'No'
          ]
        end
      end

      date_suffix = if start_date && end_date
                      "#{start_date}_to_#{end_date}"
                    else
                      Date.current.iso8601
                    end

      {
        csv_data: csv_string,
        filename: "openfinance-transactions-#{date_suffix}.csv"
      }
    end
  end
end

require 'csv'

module Transactions
  class CsvImportService < ApplicationService
    attr_accessor :household, :account_id, :csv_content, :column_mapping, :filename, :format_type

    MINT_COLUMNS = {
      "Date" => :date,
      "Description" => :name,
      "Original Description" => :merchant_name,
      "Amount" => :amount,
      "Transaction Type" => :transaction_type,
      "Category" => :category_name,
      "Account Name" => :account_name,
      "Notes" => :notes
    }.freeze

    DEFAULT_MAPPING = {
      "date" => :date,
      "description" => :name,
      "amount" => :amount,
      "merchant" => :merchant_name,
      "category" => :category_name,
      "notes" => :notes
    }.freeze

    def initialize(household:, account_id:, csv_content:, column_mapping: nil, filename: "import.csv", format_type: "auto")
      @household = household
      @account_id = account_id
      @csv_content = csv_content
      @column_mapping = column_mapping
      @filename = filename
      @format_type = format_type
    end

    def call
      account = household.accounts.find(account_id)
      rows = parse_csv
      mapping = determine_mapping(rows.first&.headers || [])

      csv_import = CsvImport.create!(
        household: household,
        account: account,
        filename: filename,
        status: "processing",
        total_rows: rows.length,
        column_mapping: mapping
      )

      imported = 0
      skipped = 0
      errors_log = []

      rows.each_with_index do |row, idx|
        begin
          attrs = map_row(row, mapping, account)
          next if attrs.nil?

          # Skip duplicates by checking date + amount + name
          existing = household.transactions.find_by(
            account: account,
            date: attrs[:date],
            amount_cents: attrs[:amount_cents],
            name: attrs[:name]
          )

          if existing
            skipped += 1
            next
          end

          Transaction.create!(attrs)
          imported += 1
        rescue => e
          skipped += 1
          errors_log << { row: idx + 2, error: e.message }
        end
      end

      csv_import.update!(
        status: "completed",
        imported_rows: imported,
        skipped_rows: skipped,
        errors_log: errors_log
      )

      success(
        csv_import: csv_import,
        imported: imported,
        skipped: skipped,
        errors: errors_log
      )
    rescue => e
      failure(e.message)
    end

    def self.preview(csv_content:, format_type: "auto")
      service = new(household: nil, account_id: nil, csv_content: csv_content, format_type: format_type)
      rows = service.send(:parse_csv)
      headers = rows.first&.headers || []
      mapping = service.send(:determine_mapping, headers)
      sample = rows.first(5).map { |r| r.to_h }
      { headers: headers, mapping: mapping, sample_rows: sample, total_rows: rows.length }
    end

    private

    def parse_csv
      CSV.parse(csv_content, headers: true, liberal_parsing: true, skip_blanks: true)
    end

    def determine_mapping(headers)
      return column_mapping if column_mapping.present?

      normalized = headers.map { |h| [h, h.to_s.strip.downcase] }.to_h

      if normalized.values.include?("original description")
        # Mint format
        mapping = {}
        MINT_COLUMNS.each do |mint_col, field|
          match = headers.find { |h| h.to_s.strip == mint_col }
          mapping[match] = field.to_s if match
        end
        mapping
      else
        # Auto-detect generic format
        mapping = {}
        headers.each do |header|
          key = header.to_s.strip.downcase
          if key.match?(/date/)
            mapping[header] = "date"
          elsif key.match?(/desc|memo|payee|name/)
            mapping[header] = "name"
          elsif key.match?(/amount|debit|credit/)
            mapping[header] = "amount"
          elsif key.match?(/merchant/)
            mapping[header] = "merchant_name"
          elsif key.match?(/categ/)
            mapping[header] = "category_name"
          elsif key.match?(/note|memo/)
            mapping[header] = "notes"
          end
        end
        mapping
      end
    end

    def map_row(row, mapping, account)
      date_col = mapping.find { |_, v| v.to_s == "date" }&.first
      name_col = mapping.find { |_, v| v.to_s == "name" }&.first
      amount_col = mapping.find { |_, v| v.to_s == "amount" }&.first
      merchant_col = mapping.find { |_, v| v.to_s == "merchant_name" }&.first
      notes_col = mapping.find { |_, v| v.to_s == "notes" }&.first
      type_col = mapping.find { |_, v| v.to_s == "transaction_type" }&.first

      date_str = row[date_col]&.strip
      return nil if date_str.blank?

      date = begin
        Date.strptime(date_str, '%m/%d/%Y')
      rescue Date::Error
        Date.parse(date_str)
      end
      name = row[name_col]&.strip || "Imported transaction"
      amount_str = row[amount_col]&.strip&.gsub(/[$,]/, '')
      return nil if amount_str.blank?

      amount = amount_str.to_f

      # Mint format: "debit" means negative
      if type_col && row[type_col]&.strip&.downcase == "debit"
        amount = -amount.abs
      end

      amount_cents = (amount * 100).round

      {
        household: household,
        account: account,
        date: date,
        name: name,
        merchant_name: row[merchant_col]&.strip,
        notes: row[notes_col]&.strip,
        amount_cents: amount_cents,
        currency: account.currency || "USD",
        needs_review: true
      }
    end
  end
end

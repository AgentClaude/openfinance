# Service for importing transactions from OFX/QFX bank statement files.
#
# Usage:
#   Transactions::OfxImportService.call(
#     household: household,
#     account_id: account.id,
#     file_content: raw_ofx_string,
#     filename: "statement.ofx"
#   )

module Transactions
  class OfxImportService < ApplicationService
    attr_accessor :household, :account_id, :file_content, :filename, :update_balance

    validates :household, presence: true
    validates :account_id, presence: true
    validates :file_content, presence: true

    def initialize(household:, account_id:, file_content:, filename: "import.ofx", update_balance: false)
      @household = household
      @account_id = account_id
      @file_content = file_content
      @filename = filename
      @update_balance = update_balance
    end

    def call
      return validation_failure(self) unless valid?

      account = household.accounts.find_by(id: account_id)
      return failure("Account not found") unless account

      # Parse the OFX file
      parsed = Transactions::OfxParser.new(file_content).parse

      format_type = filename.to_s.downcase.end_with?(".qfx") ? "qfx" : "ofx"

      statement_import = StatementImport.create!(
        household: household,
        account: account,
        filename: filename,
        format_type: format_type,
        status: "processing",
        total_rows: parsed[:transactions].length,
        metadata: {
          bank_account: parsed[:account],
          balance: parsed[:balance],
          date_range: parsed[:date_range],
          is_credit_card: parsed[:is_credit_card]
        }
      )

      imported = 0
      skipped = 0
      errors_log = []

      parsed[:transactions].each_with_index do |txn, idx|
        next if txn[:date].nil? || txn[:amount].nil?

        amount_cents = (txn[:amount] * 100).round
        name = txn[:name] || txn[:memo] || "Imported transaction"
        fit_id = txn[:fit_id]

        # Skip duplicates: check by fit_id (unique per bank) or date+amount+name
        if fit_id.present?
          existing = household.transactions.where(account: account)
            .where("metadata->>'ofx_fit_id' = ?", fit_id).exists?
        else
          existing = household.transactions.exists?(
            account: account,
            date: txn[:date],
            amount_cents: amount_cents,
            name: name
          )
        end

        if existing
          skipped += 1
          next
        end

        begin
          Transaction.create!(
            household: household,
            account: account,
            date: txn[:date],
            amount_cents: amount_cents,
            currency: account.currency || "USD",
            name: name,
            merchant_name: extract_merchant(txn),
            notes: txn[:memo] != txn[:name] ? txn[:memo] : nil,
            needs_review: true,
            metadata: {
              ofx_fit_id: fit_id,
              ofx_type: txn[:type],
              ofx_check_num: txn[:check_num],
              ofx_ref_num: txn[:ref_num],
              ofx_sic: txn[:sic],
              import_id: statement_import.id
            }.compact
          )
          imported += 1
        rescue ActiveRecord::RecordInvalid => e
          skipped += 1
          errors_log << { row: idx + 1, error: e.message }
        end
      end

      # Optionally update account balance from statement
      if update_balance && parsed[:balance]&.dig(:amount)
        balance_cents = (parsed[:balance][:amount] * 100).round
        account.update!(current_balance_cents: balance_cents)
      end

      statement_import.update!(
        status: "completed",
        imported_rows: imported,
        skipped_rows: skipped,
        errors_log: errors_log
      )

      success(
        statement_import: statement_import,
        imported: imported,
        skipped: skipped,
        errors: errors_log,
        account_info: parsed[:account],
        balance: parsed[:balance],
        date_range: parsed[:date_range]
      )
    rescue Transactions::OfxParser::ParseError => e
      failure("Invalid OFX file: #{e.message}")
    rescue ActiveRecord::RecordNotFound => e
      failure("Account not found")
    rescue StandardError => e
      Rails.logger.error "OFX import failed: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      failure("Import failed: #{e.message}")
    end

    # Preview OFX file without importing — returns parsed data for UI preview
    def self.preview(file_content:)
      parsed = Transactions::OfxParser.new(file_content).parse

      {
        transactions: parsed[:transactions].first(10).map do |txn|
          {
            date: txn[:date]&.iso8601,
            amount: txn[:amount],
            name: txn[:name],
            memo: txn[:memo],
            type: txn[:type]
          }
        end,
        total_count: parsed[:transactions].length,
        account: parsed[:account],
        balance: parsed[:balance],
        date_range: {
          start: parsed[:date_range]&.dig(:start)&.iso8601,
          end: parsed[:date_range]&.dig(:end)&.iso8601
        },
        is_credit_card: parsed[:is_credit_card]
      }
    rescue Transactions::OfxParser::ParseError => e
      raise e
    end

    private

    def extract_merchant(txn)
      # OFX NAME field often has the merchant, MEMO has additional detail
      # Try to clean up common bank formatting
      name = txn[:name].to_s
      # Strip trailing reference numbers, dates, card numbers
      cleaned = name.gsub(/\s+\d{4}\*+\d{4}/, "")  # card numbers
                     .gsub(/\s+\d{2}\/\d{2}$/, "")   # trailing dates
                     .gsub(/\s+#\d+$/, "")            # reference numbers
                     .strip

      cleaned.presence
    end
  end
end

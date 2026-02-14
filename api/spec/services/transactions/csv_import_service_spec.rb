require 'rails_helper'

RSpec.describe Transactions::CsvImportService do
  let(:household) { create(:household) }
  let(:account) { create(:account, household: household) }

  describe '#call' do
    it 'imports generic CSV format' do
      csv = <<~CSV
        Date,Description,Amount
        2026-01-15,Coffee Shop,-4.50
        2026-01-16,Payroll,3000.00
      CSV

      result = described_class.new(
        household: household,
        account_id: account.id,
        csv_content: csv,
        filename: "test.csv"
      ).call

      expect(result).to be_success
      expect(result.data[:imported]).to eq(2)
      expect(result.data[:skipped]).to eq(0)
    end

    it 'imports Mint CSV format' do
      csv = <<~CSV
        Date,Description,Original Description,Amount,Transaction Type,Category,Account Name,Notes
        01/15/2026,Coffee Shop,COFFEE SHOP #123,4.50,debit,Food & Dining,Checking,
        01/16/2026,Payroll,ACME CORP,3000.00,credit,Income,Checking,
      CSV

      result = described_class.new(
        household: household,
        account_id: account.id,
        csv_content: csv,
        filename: "mint.csv"
      ).call

      expect(result).to be_success
      expect(result.data[:imported]).to eq(2)
      # Mint debit should be negative
      txn = household.transactions.find_by(name: "Coffee Shop")
      expect(txn.amount_cents).to be < 0
    end

    it 'skips duplicate transactions' do
      csv = <<~CSV
        Date,Description,Amount
        2026-01-15,Coffee Shop,-4.50
      CSV

      # Import once
      described_class.new(
        household: household,
        account_id: account.id,
        csv_content: csv,
        filename: "test.csv"
      ).call

      # Import again
      result = described_class.new(
        household: household,
        account_id: account.id,
        csv_content: csv,
        filename: "test2.csv"
      ).call

      expect(result).to be_success
      expect(result.data[:imported]).to eq(0)
      expect(result.data[:skipped]).to eq(1)
    end
  end

  describe '.preview' do
    it 'returns headers and sample rows' do
      csv = <<~CSV
        Date,Description,Amount
        2026-01-15,Coffee Shop,-4.50
      CSV

      result = described_class.preview(csv_content: csv)
      expect(result[:headers]).to include("Date", "Description", "Amount")
      expect(result[:total_rows]).to eq(1)
      expect(result[:mapping]).to be_a(Hash)
    end
  end
end

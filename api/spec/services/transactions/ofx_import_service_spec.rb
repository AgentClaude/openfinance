require 'rails_helper'

RSpec.describe Transactions::OfxImportService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }

  let(:ofx_content) do
    <<~OFX
      OFXHEADER:100
      DATA:OFXSGML
      VERSION:102

      <OFX>
      <SIGNONMSGSRSV1>
      <SONRS>
      <STATUS><CODE>0<SEVERITY>INFO</STATUS>
      <DTSERVER>20260315
      <LANGUAGE>ENG
      </SONRS>
      </SIGNONMSGSRSV1>
      <BANKMSGSRSV1>
      <STMTTRNRS>
      <STMTRS>
      <CURDEF>USD
      <BANKACCTFROM>
      <BANKID>123456789
      <ACCTID>9876543210
      <ACCTTYPE>CHECKING
      </BANKACCTFROM>
      <BANKTRANLIST>
      <DTSTART>20260301
      <DTEND>20260315
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260305
      <TRNAMT>-42.50
      <FITID>OFX001
      <NAME>GROCERY STORE
      <MEMO>Weekly groceries
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260310
      <TRNAMT>2500.00
      <FITID>OFX002
      <NAME>EMPLOYER PAYROLL
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260312
      <TRNAMT>-15.99
      <FITID>OFX003
      <NAME>STREAMING SERVICE
      </STMTTRN>
      </BANKTRANLIST>
      <LEDGERBAL>
      <BALAMT>5000.00
      <DTASOF>20260315
      </LEDGERBAL>
      </STMTRS>
      </STMTTRNRS>
      </BANKMSGSRSV1>
      </OFX>
    OFX
  end

  describe '#call' do
    subject(:result) do
      described_class.new(
        household: household,
        account_id: account.id,
        file_content: ofx_content,
        filename: "march-2026.ofx"
      ).call
    end

    it 'succeeds' do
      expect(result).to be_success
    end

    it 'imports all transactions' do
      expect(result.data[:imported]).to eq(3)
      expect(result.data[:skipped]).to eq(0)
    end

    it 'creates transaction records' do
      expect { result }.to change(Transaction, :count).by(3)
    end

    it 'sets correct transaction attributes' do
      result
      txn = household.transactions.find_by("metadata->>'ofx_fit_id' = ?", 'OFX001')
      expect(txn.date).to eq(Date.new(2026, 3, 5))
      expect(txn.amount_cents).to eq(-4250)
      expect(txn.name).to eq('GROCERY STORE')
      expect(txn.needs_review).to be true
    end

    it 'stores OFX metadata in transaction' do
      result
      txn = household.transactions.find_by("metadata->>'ofx_fit_id' = ?", 'OFX001')
      expect(txn.metadata['ofx_type']).to eq('DEBIT')
    end

    it 'creates a StatementImport record' do
      expect { result }.to change(StatementImport, :count).by(1)
      import = StatementImport.last
      expect(import.filename).to eq("march-2026.ofx")
      expect(import.format_type).to eq("ofx")
      expect(import.status).to eq("completed")
      expect(import.imported_rows).to eq(3)
      expect(import.total_rows).to eq(3)
    end

    it 'stores bank metadata in the import record' do
      result
      import = StatementImport.last
      expect(import.metadata['bank_account']['bank_id']).to eq('123456789')
      expect(import.metadata['bank_account']['account_id']).to eq('9876543210')
      expect(import.metadata['balance']['amount']).to eq(5000.0)
    end

    context 'with duplicate transactions (by fit_id)' do
      before do
        create(:transaction,
          household: household,
          account: account,
          date: Date.new(2026, 3, 5),
          amount_cents: -4250,
          name: 'GROCERY STORE',
          metadata: { ofx_fit_id: 'OFX001' }
        )
      end

      it 'skips duplicates' do
        expect(result.data[:imported]).to eq(2)
        expect(result.data[:skipped]).to eq(1)
      end

      it 'only creates new transactions' do
        expect { result }.to change(Transaction, :count).by(2)
      end
    end

    context 'with update_balance option' do
      subject(:result) do
        described_class.new(
          household: household,
          account_id: account.id,
          file_content: ofx_content,
          filename: "march-2026.ofx",
          update_balance: true
        ).call
      end

      it 'updates account balance from statement' do
        result
        expect(account.reload.current_balance_cents).to eq(500000)
      end
    end

    context 'without update_balance option' do
      it 'does not change account balance' do
        original_balance = account.current_balance_cents
        result
        expect(account.reload.current_balance_cents).to eq(original_balance)
      end
    end

    context 'with QFX file' do
      subject(:result) do
        described_class.new(
          household: household,
          account_id: account.id,
          file_content: ofx_content,
          filename: "march-2026.qfx"
        ).call
      end

      it 'records format_type as qfx' do
        result
        expect(StatementImport.last.format_type).to eq("qfx")
      end
    end

    context 'with invalid account_id' do
      subject(:result) do
        described_class.new(
          household: household,
          account_id: SecureRandom.uuid,
          file_content: ofx_content,
          filename: "test.ofx"
        ).call
      end

      it 'returns failure' do
        expect(result).to be_failure
        expect(result.error_message).to include('Account not found')
      end
    end

    context 'with invalid OFX content' do
      subject(:result) do
        described_class.new(
          household: household,
          account_id: account.id,
          file_content: "not an ofx file",
          filename: "bad.ofx"
        ).call
      end

      it 'returns failure' do
        expect(result).to be_failure
        expect(result.error_message).to include('Invalid OFX file')
      end
    end

    context 'with missing required attributes' do
      it 'fails without household' do
        result = described_class.new(
          household: nil,
          account_id: account.id,
          file_content: ofx_content
        ).call
        expect(result).to be_failure
      end

      it 'fails without file_content' do
        result = described_class.new(
          household: household,
          account_id: account.id,
          file_content: nil
        ).call
        expect(result).to be_failure
      end
    end
  end

  describe '.preview' do
    it 'returns parsed transaction data without importing' do
      preview = described_class.preview(file_content: ofx_content)

      expect(preview[:total_count]).to eq(3)
      expect(preview[:transactions].length).to eq(3)
      expect(preview[:account][:type]).to eq('CHECKING')
      expect(preview[:balance][:amount]).to eq(5000.0)
      expect(Transaction.count).to eq(0)
    end

    it 'limits preview to 10 transactions' do
      # Our fixture has only 3, so just check it returns up to 10
      preview = described_class.preview(file_content: ofx_content)
      expect(preview[:transactions].length).to be <= 10
    end

    it 'raises for invalid content' do
      expect { described_class.preview(file_content: "bad data") }
        .to raise_error(Transactions::OfxParser::ParseError)
    end
  end
end

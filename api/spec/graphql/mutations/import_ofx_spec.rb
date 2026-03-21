# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ImportOfx do
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
      <FITID>GQLOFX001
      <NAME>GROCERY STORE
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260310
      <TRNAMT>2500.00
      <FITID>GQLOFX002
      <NAME>EMPLOYER PAYROLL
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

  def execute_query(query, variables: {}, context_user: user)
    OpenfinanceSchema.execute(
      query,
      variables: variables,
      context: { current_user: context_user }
    )
  end

  describe 'importOfx mutation' do
    let(:mutation) do
      <<~GQL
        mutation ImportOfx($accountId: ID!, $fileContent: String!, $filename: String, $updateBalance: Boolean) {
          importOfx(accountId: $accountId, fileContent: $fileContent, filename: $filename, updateBalance: $updateBalance) {
            imported
            skipped
            errors
            importId
            accountInfo
            balance
            dateRange
          }
        }
      GQL
    end

    it 'imports transactions from OFX content' do
      result = execute_query(mutation, variables: {
        accountId: account.id,
        fileContent: ofx_content,
        filename: 'test.ofx'
      })

      data = result.dig('data', 'importOfx')
      expect(data['imported']).to eq(2)
      expect(data['skipped']).to eq(0)
      expect(data['errors']).to be_empty
      expect(data['importId']).to be_present
    end

    it 'creates transaction records in the database' do
      expect {
        execute_query(mutation, variables: {
          accountId: account.id,
          fileContent: ofx_content
        })
      }.to change(Transaction, :count).by(2)
    end

    it 'returns account info from the statement' do
      result = execute_query(mutation, variables: {
        accountId: account.id,
        fileContent: ofx_content
      })

      data = result.dig('data', 'importOfx')
      expect(data['accountInfo']).to include(bank_id: '123456789').or include('bank_id' => '123456789')
    end

    it 'returns balance info from the statement' do
      result = execute_query(mutation, variables: {
        accountId: account.id,
        fileContent: ofx_content
      })

      data = result.dig('data', 'importOfx')
      expect(data['balance']).to include(amount: 5000.0).or include('amount' => 5000.0)
    end

    context 'with updateBalance: true' do
      it 'updates the account balance' do
        execute_query(mutation, variables: {
          accountId: account.id,
          fileContent: ofx_content,
          updateBalance: true
        })

        expect(account.reload.current_balance_cents).to eq(500000)
      end
    end

    context 'with invalid OFX content' do
      it 'returns an error' do
        result = execute_query(mutation, variables: {
          accountId: account.id,
          fileContent: 'not valid ofx'
        })

        data = result.dig('data', 'importOfx')
        expect(data['imported']).to eq(0)
        expect(data['errors']).not_to be_empty
      end
    end

    context 'without authentication' do
      it 'rejects unauthenticated requests' do
        result = execute_query(mutation, variables: {
          accountId: account.id,
          fileContent: ofx_content
        }, context_user: nil)

        expect(result['errors']).to be_present
      end
    end
  end
end

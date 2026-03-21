# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::PreviewOfx do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

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
      <FITID>PREV001
      <NAME>GROCERY STORE
      <MEMO>Weekly groceries
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260310
      <TRNAMT>2500.00
      <FITID>PREV002
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

  describe 'previewOfx mutation' do
    let(:mutation) do
      <<~GQL
        mutation PreviewOfx($fileContent: String!) {
          previewOfx(fileContent: $fileContent) {
            transactions
            totalCount
            account
            balance
            dateRange
            isCreditCard
            error
          }
        }
      GQL
    end

    it 'returns parsed transaction preview' do
      result = execute_query(mutation, variables: { fileContent: ofx_content })

      data = result.dig('data', 'previewOfx')
      expect(data['totalCount']).to eq(2)
      expect(data['transactions'].length).to eq(2)
      expect(data['isCreditCard']).to be false
      expect(data['error']).to be_nil
    end

    it 'returns account info' do
      result = execute_query(mutation, variables: { fileContent: ofx_content })

      data = result.dig('data', 'previewOfx')
      acct = data['account']
      expect(acct[:type] || acct['type']).to eq('CHECKING')
      expect(acct[:bank_id] || acct['bank_id']).to eq('123456789')
    end

    it 'returns balance info' do
      result = execute_query(mutation, variables: { fileContent: ofx_content })

      data = result.dig('data', 'previewOfx')
      bal = data['balance']
      expect(bal[:amount] || bal['amount']).to eq(5000.0)
    end

    it 'returns date range' do
      result = execute_query(mutation, variables: { fileContent: ofx_content })

      data = result.dig('data', 'previewOfx')
      dr = data['dateRange']
      expect(dr).to be_present
      expect(dr.keys.map(&:to_s)).to include('start', 'end')
    end

    it 'does not create any records' do
      expect {
        execute_query(mutation, variables: { fileContent: ofx_content })
      }.not_to change(Transaction, :count)
    end

    context 'with invalid OFX content' do
      it 'returns an error message without crashing' do
        result = execute_query(mutation, variables: { fileContent: 'not valid ofx' })

        data = result.dig('data', 'previewOfx')
        expect(data['error']).to be_present
        expect(data['totalCount']).to eq(0)
        expect(data['transactions']).to be_empty
      end
    end

    context 'without authentication' do
      it 'rejects unauthenticated requests' do
        result = execute_query(mutation, variables: {
          fileContent: ofx_content
        }, context_user: nil)

        expect(result['errors']).to be_present
      end
    end
  end
end

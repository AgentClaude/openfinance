require 'rails_helper'

RSpec.describe Transactions::OfxParser do
  let(:ofx_v1_content) do
    <<~OFX
      OFXHEADER:100
      DATA:OFXSGML
      VERSION:102
      SECURITY:NONE
      ENCODING:USASCII
      CHARSET:1252
      COMPRESSION:NONE
      OLDFILEUID:NONE
      NEWFILEUID:NONE

      <OFX>
      <SIGNONMSGSRSV1>
      <SONRS>
      <STATUS>
      <CODE>0
      <SEVERITY>INFO
      </STATUS>
      <DTSERVER>20260315120000
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
      <FITID>202603050001
      <NAME>WHOLE FOODS MARKET
      <MEMO>Grocery purchase
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260310
      <TRNAMT>2500.00
      <FITID>202603100001
      <NAME>ACME CORP PAYROLL
      <MEMO>Direct deposit
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260312
      <TRNAMT>-15.99
      <FITID>202603120001
      <NAME>NETFLIX
      </STMTTRN>
      </BANKTRANLIST>
      <LEDGERBAL>
      <BALAMT>5432.10
      <DTASOF>20260315
      </LEDGERBAL>
      </STMTRS>
      </STMTTRNRS>
      </BANKMSGSRSV1>
      </OFX>
    OFX
  end

  let(:ofx_v2_xml_content) do
    <<~OFX
      <?xml version="1.0" encoding="UTF-8"?>
      <?OFX OFXHEADER="200" VERSION="220" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
      <OFX>
      <SIGNONMSGSRSV1>
      <SONRS>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <DTSERVER>20260315120000</DTSERVER>
      <LANGUAGE>ENG</LANGUAGE>
      </SONRS>
      </SIGNONMSGSRSV1>
      <BANKMSGSRSV1>
      <STMTTRNRS>
      <STMTRS>
      <CURDEF>USD</CURDEF>
      <BANKACCTFROM>
      <BANKID>987654321</BANKID>
      <ACCTID>1122334455</ACCTID>
      <ACCTTYPE>SAVINGS</ACCTTYPE>
      </BANKACCTFROM>
      <BANKTRANLIST>
      <DTSTART>20260301</DTSTART>
      <DTEND>20260315</DTEND>
      <STMTTRN>
      <TRNTYPE>DEBIT</TRNTYPE>
      <DTPOSTED>20260307</DTPOSTED>
      <TRNAMT>-200.00</TRNAMT>
      <FITID>TXN001</FITID>
      <NAME>ATM WITHDRAWAL</NAME>
      </STMTTRN>
      </BANKTRANLIST>
      <LEDGERBAL>
      <BALAMT>10000.00</BALAMT>
      <DTASOF>20260315</DTASOF>
      </LEDGERBAL>
      </STMTRS>
      </STMTTRNRS>
      </BANKMSGSRSV1>
      </OFX>
    OFX
  end

  let(:credit_card_ofx) do
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
      <CREDITCARDMSGSRSV1>
      <CCSTMTTRNRS>
      <CCSTMTRS>
      <CURDEF>USD
      <CCACCTFROM>
      <ACCTID>4111222233334444
      </CCACCTFROM>
      <BANKTRANLIST>
      <DTSTART>20260301
      <DTEND>20260315
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260308
      <TRNAMT>-89.99
      <FITID>CC001
      <NAME>AMAZON.COM
      <MEMO>Online purchase
      </STMTTRN>
      </BANKTRANLIST>
      <LEDGERBAL>
      <BALAMT>-1234.56
      <DTASOF>20260315
      </LEDGERBAL>
      </CCSTMTRS>
      </CCSTMTTRNRS>
      </CREDITCARDMSGSRSV1>
      </OFX>
    OFX
  end

  describe '#parse' do
    context 'with OFX v1 (SGML) content' do
      subject(:result) { described_class.new(ofx_v1_content).parse }

      it 'extracts all transactions' do
        expect(result[:transactions].length).to eq(3)
      end

      it 'parses transaction details correctly' do
        txn = result[:transactions].first
        expect(txn[:type]).to eq('DEBIT')
        expect(txn[:date]).to eq(Date.new(2026, 3, 5))
        expect(txn[:amount]).to eq(-42.50)
        expect(txn[:fit_id]).to eq('202603050001')
        expect(txn[:name]).to eq('WHOLE FOODS MARKET')
        expect(txn[:memo]).to eq('Grocery purchase')
      end

      it 'parses income transactions' do
        txn = result[:transactions][1]
        expect(txn[:type]).to eq('CREDIT')
        expect(txn[:amount]).to eq(2500.00)
        expect(txn[:name]).to eq('ACME CORP PAYROLL')
      end

      it 'handles transactions without memo' do
        txn = result[:transactions][2]
        expect(txn[:name]).to eq('NETFLIX')
        expect(txn[:memo]).to be_nil
      end

      it 'extracts account info' do
        expect(result[:account][:bank_id]).to eq('123456789')
        expect(result[:account][:account_id]).to eq('9876543210')
        expect(result[:account][:type]).to eq('CHECKING')
      end

      it 'extracts balance' do
        expect(result[:balance][:amount]).to eq(5432.10)
        expect(result[:balance][:as_of]).to eq(Date.new(2026, 3, 15))
      end

      it 'extracts date range' do
        expect(result[:date_range][:start]).to eq(Date.new(2026, 3, 1))
        expect(result[:date_range][:end]).to eq(Date.new(2026, 3, 15))
      end

      it 'identifies as non-credit-card' do
        expect(result[:is_credit_card]).to be false
      end
    end

    context 'with OFX v2 (XML) content' do
      subject(:result) { described_class.new(ofx_v2_xml_content).parse }

      it 'extracts transactions from XML format' do
        expect(result[:transactions].length).to eq(1)
        txn = result[:transactions].first
        expect(txn[:amount]).to eq(-200.00)
        expect(txn[:name]).to eq('ATM WITHDRAWAL')
      end

      it 'extracts savings account info' do
        expect(result[:account][:type]).to eq('SAVINGS')
        expect(result[:account][:account_id]).to eq('1122334455')
      end
    end

    context 'with credit card statement' do
      subject(:result) { described_class.new(credit_card_ofx).parse }

      it 'identifies as credit card' do
        expect(result[:is_credit_card]).to be true
      end

      it 'extracts credit card account' do
        expect(result[:account][:account_id]).to eq('4111222233334444')
      end

      it 'parses credit card transactions' do
        txn = result[:transactions].first
        expect(txn[:amount]).to eq(-89.99)
        expect(txn[:name]).to eq('AMAZON.COM')
      end

      it 'extracts negative balance (owed)' do
        expect(result[:balance][:amount]).to eq(-1234.56)
      end
    end

    context 'with invalid content' do
      it 'raises ParseError for empty content' do
        expect { described_class.new('').parse }
          .to raise_error(Transactions::OfxParser::ParseError, /No OFX data found/)
      end

      it 'raises ParseError for content without OFX tag' do
        expect { described_class.new('just some random text').parse }
          .to raise_error(Transactions::OfxParser::ParseError, /No OFX data found/)
      end

      it 'raises ParseError for OFX without statement data' do
        content = "<OFX><SIGNONMSGSRSV1></SIGNONMSGSRSV1></OFX>"
        expect { described_class.new(content).parse }
          .to raise_error(Transactions::OfxParser::ParseError, /No statement data found/)
      end
    end

    context 'with edge cases' do
      it 'handles Windows-style line endings' do
        content = ofx_v1_content.gsub("\n", "\r\n")
        result = described_class.new(content).parse
        expect(result[:transactions].length).to eq(3)
      end

      it 'handles transactions with check numbers' do
        content = ofx_v1_content.gsub(
          "<NAME>NETFLIX",
          "<CHECKNUM>1234\n<NAME>NETFLIX"
        )
        result = described_class.new(content).parse
        txn = result[:transactions].last
        expect(txn[:check_num]).to eq('1234')
      end
    end
  end
end

# Parses OFX/QFX statement files into structured transaction data.
# Handles both OFX v1 (SGML) and OFX v2 (XML) formats.
#
# Usage:
#   parser = Transactions::OfxParser.new(file_content)
#   result = parser.parse
#   result[:transactions] => [{ date:, amount:, fit_id:, name:, memo:, type: }, ...]
#   result[:account]      => { bank_id:, account_id:, type: }
#   result[:balance]      => { amount:, as_of: }
#   result[:date_range]   => { start:, end: }

module Transactions
  class OfxParser
    TRANSACTION_TYPES = %w[CREDIT DEBIT INT DIV FEE SRVCHG DEP ATM POS XFER CHECK PAYMENT CASH DIRECTDEP DIRECTDEBIT REPEATPMT OTHER].freeze

    attr_reader :content

    def initialize(content)
      @content = content.to_s.dup.force_encoding("UTF-8")
    end

    def parse
      # Strip OFX/QFX headers (everything before <OFX>)
      xml_content = extract_xml_body
      raise ParseError, "No OFX data found in file" if xml_content.blank?

      # Convert SGML to XML if needed (v1 has unclosed tags)
      xml_content = sgml_to_xml(xml_content)

      doc = Nokogiri::XML(xml_content) { |config| config.recover }
      raise ParseError, "Failed to parse OFX XML structure" if doc.root.nil?

      # Extract bank statement response (checking/savings)
      stmt = doc.at("STMTRS") || doc.at("CCSTMTRS")
      raise ParseError, "No statement data found (STMTRS or CCSTMTRS)" unless stmt

      {
        transactions: extract_transactions(stmt),
        account: extract_account(stmt),
        balance: extract_balance(stmt),
        date_range: extract_date_range(stmt),
        is_credit_card: doc.at("CCSTMTRS").present?
      }
    end

    private

    def extract_xml_body
      # OFX files start with headers, then <OFX>
      # Match the opening <OFX> tag (not <?OFX processing instructions)
      idx = content.index(/<OFX\s*>/i)
      return nil unless idx
      content[idx..]
    end

    def sgml_to_xml(sgml)
      # OFX v1 uses SGML: tags aren't closed.
      # Convert <TAG>value to <TAG>value</TAG>
      # But only for leaf tags that don't already have closing tags.
      
      # First, normalize line endings
      text = sgml.gsub("\r\n", "\n").gsub("\r", "\n")

      # If the content already has properly closed XML tags, skip conversion.
      # Detect by checking if most tags are already closed.
      return text if text.scan(/<\/\w+>/).length > text.scan(/<\w+>/).length / 2

      # Find leaf tags: <TAG>value (not followed by </ closing tag on same chunk)
      text.gsub!(/<(\w+)>([^<\n]+)/) do |_match|
        tag = $1
        value = $2.strip
        if value.present?
          "<#{tag}>#{value}</#{tag}>"
        else
          "<#{tag}>"
        end
      end

      text
    end

    def extract_transactions(stmt)
      tranlist = stmt.at("BANKTRANLIST")
      return [] unless tranlist

      tranlist.css("STMTTRN").map do |trn|
        type = text_at(trn, "TRNTYPE")
        {
          type: type,
          date: parse_ofx_date(text_at(trn, "DTPOSTED")),
          amount: text_at(trn, "TRNAMT")&.to_f,
          fit_id: text_at(trn, "FITID"),
          name: text_at(trn, "NAME"),
          memo: text_at(trn, "MEMO"),
          check_num: text_at(trn, "CHECKNUM"),
          ref_num: text_at(trn, "REFNUM"),
          sic: text_at(trn, "SIC")
        }.compact
      end
    end

    def extract_account(stmt)
      acct = stmt.at("BANKACCTFROM") || stmt.at("CCACCTFROM")
      return nil unless acct

      {
        bank_id: text_at(acct, "BANKID"),
        account_id: text_at(acct, "ACCTID"),
        type: text_at(acct, "ACCTTYPE")&.upcase # CHECKING, SAVINGS, CREDITLINE, etc.
      }.compact
    end

    def extract_balance(stmt)
      bal = stmt.at("LEDGERBAL") || stmt.at("AVAILBAL")
      return nil unless bal

      {
        amount: text_at(bal, "BALAMT")&.to_f,
        as_of: parse_ofx_date(text_at(bal, "DTASOF"))
      }.compact
    end

    def extract_date_range(stmt)
      tranlist = stmt.at("BANKTRANLIST")
      return nil unless tranlist

      {
        start: parse_ofx_date(text_at(tranlist, "DTSTART")),
        end: parse_ofx_date(text_at(tranlist, "DTEND"))
      }.compact
    end

    def text_at(node, tag)
      el = node.at(tag)
      el&.text&.strip.presence
    end

    def parse_ofx_date(str)
      return nil if str.blank?
      # OFX dates: YYYYMMDDHHMMSS[.XXX:TZ] or YYYYMMDD
      date_part = str[0..7]
      Date.strptime(date_part, "%Y%m%d")
    rescue Date::Error
      nil
    end

    class ParseError < StandardError; end
  end
end

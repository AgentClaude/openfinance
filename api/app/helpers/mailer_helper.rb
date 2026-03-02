module MailerHelper
  def format_cents(cents)
    return '0.00' if cents.nil? || cents.zero?

    number = cents.abs / 100.0
    if number >= 1000
      parts = number.round(2).to_s.split('.')
      int_part = parts[0].reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
      "#{int_part}.#{(parts[1] || '00').ljust(2, '0')}"
    else
      '%.2f' % number
    end
  end
end

module CurrencyHelper
  def format_currency(cents)
    return '$0.00' if cents.nil? || cents.zero?
    negative = cents < 0
    amount = cents.abs / 100.0
    formatted = number_with_delimiter(format('%.2f', amount))
    negative ? "-$#{formatted}" : "$#{formatted}"
  end

  private

  def number_with_delimiter(number)
    parts = number.to_s.split('.')
    parts[0] = parts[0].gsub(/(\d)(?=(\d{3})+(?!\d))/, '\\1,')
    parts.join('.')
  end
end

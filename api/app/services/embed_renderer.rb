# Generates self-contained, iframe-ready HTML widgets for embedding.
# Each widget is a complete HTML document with inline CSS — no external dependencies.
class EmbedRenderer
  class << self
    def net_worth_html(data, theme = 'light')
      t = theme_colors(theme)
      <<~HTML
        #{html_head('Net Worth', t)}
        <body style="margin:0;padding:16px;background:#{t[:bg]};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="#{card_style(t)}">
            <div style="#{label_style(t)}">Net Worth</div>
            <div style="font-size:2.25rem;font-weight:700;color:#{t[:text]};margin-bottom:16px;">
              #{format_currency(data[:net_worth])}
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #{t[:border]};">
              <span style="color:#{t[:muted]};">Assets</span>
              <span style="color:#10b981;font-weight:600;">#{format_currency(data[:assets])}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #{t[:border]};">
              <span style="color:#{t[:muted]};">Liabilities</span>
              <span style="color:#ef4444;font-weight:600;">#{format_currency(data[:liabilities])}</span>
            </div>
            #{footer(t, data[:updated_at])}
          </div>
        </body></html>
      HTML
    end

    def spending_html(data, theme = 'light')
      t = theme_colors(theme)
      <<~HTML
        #{html_head('Monthly Spending', t)}
        <body style="margin:0;padding:16px;background:#{t[:bg]};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="#{card_style(t)}">
            <div style="#{label_style(t)}">Monthly Spending</div>
            <div style="font-size:2.25rem;font-weight:700;color:#{t[:text]};margin-bottom:16px;">
              #{format_currency(data[:total_spent])}
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #{t[:border]};">
              <span style="color:#{t[:muted]};">Month</span>
              <span style="color:#{t[:text]};font-weight:500;">#{format_month(data[:month])}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #{t[:border]};">
              <span style="color:#{t[:muted]};">Transactions</span>
              <span style="color:#{t[:text]};font-weight:500;">#{data[:transaction_count]}</span>
            </div>
            #{footer(t, data[:updated_at])}
          </div>
        </body></html>
      HTML
    end

    def budget_html(data, theme = 'light')
      t = theme_colors(theme)
      remaining = data[:remaining]
      remaining_color = remaining >= 0 ? '#10b981' : '#ef4444'

      category_rows = (data[:categories] || []).map do |cat|
        pct = [cat[:percent], 100].min
        bar_color = pct < 80 ? '#10b981' : pct < 100 ? '#f59e0b' : '#ef4444'
        <<~ROW
          <div style="padding:6px 0;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
              <span style="color:#{t[:text]};">#{ERB::Util.html_escape(cat[:name])}</span>
              <span style="color:#{t[:muted]};">#{format_currency(cat[:spent])} / #{format_currency(cat[:budgeted])}</span>
            </div>
            <div style="height:6px;background:#{t[:bar_bg]};border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:#{pct}%;background:#{bar_color};border-radius:3px;transition:width 0.3s;"></div>
            </div>
          </div>
        ROW
      end.join

      <<~HTML
        #{html_head('Budget', t)}
        <body style="margin:0;padding:16px;background:#{t[:bg]};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="#{card_style(t)}">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
              <div style="#{label_style(t)}">Budget &mdash; #{format_month(data[:month])}</div>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:16px;">
              <div style="flex:1;text-align:center;padding:10px;background:#{t[:card_inner]};border-radius:8px;">
                <div style="font-size:0.75rem;color:#{t[:muted]};margin-bottom:4px;">Budgeted</div>
                <div style="font-size:1.1rem;font-weight:700;color:#{t[:text]};">#{format_currency(data[:total_budgeted])}</div>
              </div>
              <div style="flex:1;text-align:center;padding:10px;background:#{t[:card_inner]};border-radius:8px;">
                <div style="font-size:0.75rem;color:#{t[:muted]};margin-bottom:4px;">Spent</div>
                <div style="font-size:1.1rem;font-weight:700;color:#{t[:text]};">#{format_currency(data[:total_spent])}</div>
              </div>
              <div style="flex:1;text-align:center;padding:10px;background:#{t[:card_inner]};border-radius:8px;">
                <div style="font-size:0.75rem;color:#{t[:muted]};margin-bottom:4px;">Remaining</div>
                <div style="font-size:1.1rem;font-weight:700;color:#{remaining_color};">#{format_currency(remaining)}</div>
              </div>
            </div>
            #{category_rows}
            #{footer(t, data[:updated_at])}
          </div>
        </body></html>
      HTML
    end

    def error_html(message)
      <<~HTML
        <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Error</title></head>
        <body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fef2f2;">
          <div style="background:#fff;border:1px solid #fecaca;border-radius:12px;padding:24px;text-align:center;color:#991b1b;">
            <div style="font-size:1.5rem;margin-bottom:8px;">⚠️</div>
            <div>#{ERB::Util.html_escape(message)}</div>
          </div>
        </body></html>
      HTML
    end

    private

    def html_head(title, t)
      <<~HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>OpenFinance — #{ERB::Util.html_escape(title)}</title>
          <style>*{margin:0;padding:0;box-sizing:border-box;}</style>
        </head>
      HTML
    end

    def card_style(t)
      "background:#{t[:card]};border:1px solid #{t[:border]};border-radius:12px;padding:24px;max-width:400px;"
    end

    def label_style(t)
      "font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#{t[:muted]};margin-bottom:8px;"
    end

    def footer(t, updated_at)
      time = updated_at ? Time.parse(updated_at).strftime('%b %d, %Y %l:%M %p') : ''
      <<~HTML
        <div style="margin-top:14px;padding-top:10px;border-top:1px solid #{t[:border]};display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.7rem;color:#{t[:muted]};">Updated #{time}</span>
          <span style="font-size:0.7rem;color:#{t[:muted]};font-weight:500;">Powered by OpenFinance</span>
        </div>
      HTML
    end

    def theme_colors(theme)
      if theme == 'dark'
        { bg: '#0f172a', card: '#1e293b', card_inner: '#334155', border: '#334155',
          text: '#f1f5f9', muted: '#94a3b8', bar_bg: '#334155' }
      else
        { bg: '#f8fafc', card: '#ffffff', card_inner: '#f1f5f9', border: '#e2e8f0',
          text: '#0f172a', muted: '#64748b', bar_bg: '#e2e8f0' }
      end
    end

    def format_currency(amount)
      prefix = amount < 0 ? '-$' : '$'
      "#{prefix}#{number_with_delimiter(amount.abs.round(2))}"
    end

    def number_with_delimiter(number)
      parts = ('%.2f' % number).split('.')
      parts[0] = parts[0].reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
      parts.join('.')
    end

    def format_month(month_str)
      return month_str unless month_str =~ /\A\d{4}-\d{2}\z/
      date = Date.parse("#{month_str}-01")
      date.strftime('%B %Y')
    end
  end
end

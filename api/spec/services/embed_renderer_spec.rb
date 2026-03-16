require 'rails_helper'

RSpec.describe EmbedRenderer do
  describe '.net_worth_html' do
    let(:data) { { net_worth: 45000.50, assets: 50000.00, liabilities: 4999.50, updated_at: '2026-03-15T12:00:00Z' } }

    it 'generates valid HTML with net worth data' do
      html = described_class.net_worth_html(data)
      expect(html).to include('<!DOCTYPE html>')
      expect(html).to include('Net Worth')
      expect(html).to include('$45,000.50')
      expect(html).to include('$50,000.00')
      expect(html).to include('Assets')
      expect(html).to include('Liabilities')
      expect(html).to include('Powered by OpenFinance')
    end

    it 'uses light theme colors by default' do
      html = described_class.net_worth_html(data)
      expect(html).to include('#ffffff') # light card background
    end

    it 'uses dark theme colors when specified' do
      html = described_class.net_worth_html(data, 'dark')
      expect(html).to include('#1e293b') # dark card background
      expect(html).to include('#0f172a') # dark page background
    end
  end

  describe '.spending_html' do
    let(:data) { { month: '2026-03', total_spent: 1234.56, transaction_count: 42, updated_at: '2026-03-15T12:00:00Z' } }

    it 'generates valid HTML with spending data' do
      html = described_class.spending_html(data)
      expect(html).to include('Monthly Spending')
      expect(html).to include('$1,234.56')
      expect(html).to include('42')
      expect(html).to include('March 2026')
    end
  end

  describe '.budget_html' do
    let(:data) do
      {
        month: '2026-03',
        total_budgeted: 3000.0,
        total_spent: 2100.0,
        remaining: 900.0,
        categories: [
          { name: 'Groceries', budgeted: 800.0, spent: 650.0, percent: 81 },
          { name: 'Dining', budgeted: 400.0, spent: 450.0, percent: 113 },
          { name: 'Gas', budgeted: 200.0, spent: 100.0, percent: 50 }
        ],
        updated_at: '2026-03-15T12:00:00Z'
      }
    end

    it 'generates valid HTML with budget data' do
      html = described_class.budget_html(data)
      expect(html).to include('Budget')
      expect(html).to include('March 2026')
      expect(html).to include('$3,000.00')
      expect(html).to include('$2,100.00')
      expect(html).to include('$900.00')
      expect(html).to include('Groceries')
      expect(html).to include('Dining')
      expect(html).to include('Gas')
    end

    it 'shows green progress bar for under-budget categories' do
      html = described_class.budget_html(data)
      # Gas is 50% — should have green color
      expect(html).to include('#10b981') # green
    end

    it 'shows red progress bar for over-budget categories' do
      html = described_class.budget_html(data)
      # Dining is 113% — should have red color
      expect(html).to include('#ef4444') # red
    end

    it 'shows yellow progress bar for near-budget categories' do
      html = described_class.budget_html(data)
      # Groceries is 81% — should have yellow color
      expect(html).to include('#f59e0b') # yellow
    end

    it 'HTML-escapes category names' do
      data[:categories] = [{ name: '<script>alert("xss")</script>', budgeted: 100.0, spent: 50.0, percent: 50 }]
      html = described_class.budget_html(data)
      expect(html).not_to include('<script>')
      expect(html).to include('&lt;script&gt;')
    end
  end

  describe '.error_html' do
    it 'generates error HTML with message' do
      html = described_class.error_html('Token expired')
      expect(html).to include('Token expired')
      expect(html).to include('⚠️')
    end

    it 'HTML-escapes error messages' do
      html = described_class.error_html('<script>evil</script>')
      expect(html).not_to include('<script>evil</script>')
    end
  end
end

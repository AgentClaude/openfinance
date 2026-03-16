require 'rails_helper'

RSpec.describe 'API v1 Embed Widgets', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'GET /api/v1/embed/net_worth' do
    it 'returns net worth data as JSON with a valid share token' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000)
      create(:account, :credit, household: household, current_balance_cents: -50_000)

      get '/api/v1/embed/net_worth.json', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['net_worth']).to be_a(Numeric)
      expect(json_body['assets']).to eq(5_000.0)
      expect(json_body['liabilities']).to eq(-500.0)
      expect(json_body).to have_key('updated_at')
    end

    it 'returns self-contained HTML when .html format is requested' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000)

      get '/api/v1/embed/net_worth.html', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/html')
      body = response.body
      expect(body).to include('<!DOCTYPE html>')
      expect(body).to include('Net Worth')
      expect(body).to include('$5,000.00')
      expect(body).to include('Powered by OpenFinance')
    end

    it 'supports dark theme for HTML widgets' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      create(:account, household: household, account_type: 'checking', current_balance_cents: 100_000)

      get '/api/v1/embed/net_worth.html', params: { token: share_token.token, theme: 'dark' }
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('#0f172a') # dark background
    end

    it 'returns 404 for invalid token' do
      get '/api/v1/embed/net_worth.json', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
      expect(json_body['error']).to include('Invalid or expired')
    end

    it 'returns HTML error page for invalid token with .html format' do
      get '/api/v1/embed/net_worth.html', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
      expect(response.body).to include('Invalid or expired')
    end

    it 'returns 404 for expired token' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth', expires_at: 1.day.ago)
      get '/api/v1/embed/net_worth.json', params: { token: share_token.token }
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 404 when using a spending token for net_worth endpoint' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      get '/api/v1/embed/net_worth.json', params: { token: share_token.token }
      expect(response).to have_http_status(:not_found)
    end

    it 'does not require X-Api-Key header' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      get '/api/v1/embed/net_worth.json', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /api/v1/embed/spending' do
    it 'returns spending data as JSON with a valid share token' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      account = create(:account, household: household)
      category = create(:category, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -3500)

      get '/api/v1/embed/spending.json', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq(Date.current.strftime('%Y-%m'))
      expect(json_body['total_spent']).to eq(35.0)
      expect(json_body['transaction_count']).to eq(1)
      expect(json_body).to have_key('updated_at')
    end

    it 'returns self-contained HTML when .html format is requested' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      account = create(:account, household: household)
      category = create(:category, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -3500)

      get '/api/v1/embed/spending.html', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/html')
      body = response.body
      expect(body).to include('Monthly Spending')
      expect(body).to include('$35.00')
      expect(body).to include('Powered by OpenFinance')
    end

    it 'returns 404 for invalid token' do
      get '/api/v1/embed/spending.json', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
    end

    it 'excludes income from spending total' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      account = create(:account, household: household)
      category = create(:category, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -2000) # expense
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: 100_000) # income

      get '/api/v1/embed/spending.json', params: { token: share_token.token }
      expect(json_body['total_spent']).to eq(20.0)
      expect(json_body['transaction_count']).to eq(1)
    end
  end

  describe 'GET /api/v1/embed/budget' do
    let(:budget) { create(:budget, household: household) }
    let(:category) { create(:category, household: household, name: 'Groceries') }

    it 'returns budget data as JSON with a valid share token' do
      share_token = create(:share_token, user: user, widget_type: 'budget')
      create(:budget_item, budget: budget, category: category, month: Date.current.beginning_of_month, amount_cents: 50_000)
      account = create(:account, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -30_000)

      get '/api/v1/embed/budget.json', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq(Date.current.strftime('%Y-%m'))
      expect(json_body['total_budgeted']).to eq(500.0)
      expect(json_body['total_spent']).to eq(300.0)
      expect(json_body['remaining']).to eq(200.0)
      expect(json_body['categories']).to be_an(Array)
      expect(json_body['categories'].first['name']).to eq('Groceries')
    end

    it 'returns self-contained HTML when .html format is requested' do
      share_token = create(:share_token, user: user, widget_type: 'budget')
      create(:budget_item, budget: budget, category: category, month: Date.current.beginning_of_month, amount_cents: 50_000)

      get '/api/v1/embed/budget.html', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/html')
      body = response.body
      expect(body).to include('Budget')
      expect(body).to include('Groceries')
      expect(body).to include('Powered by OpenFinance')
    end

    it 'supports month parameter' do
      share_token = create(:share_token, user: user, widget_type: 'budget')
      last_month = 1.month.ago.beginning_of_month
      create(:budget_item, budget: budget, category: category, month: last_month, amount_cents: 40_000)

      get '/api/v1/embed/budget.json', params: { token: share_token.token, month: last_month.strftime('%Y-%m') }
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq(last_month.strftime('%Y-%m'))
      expect(json_body['total_budgeted']).to eq(400.0)
    end

    it 'returns empty budget when no budget items exist' do
      share_token = create(:share_token, user: user, widget_type: 'budget')

      get '/api/v1/embed/budget.json', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['total_budgeted']).to eq(0.0)
      expect(json_body['total_spent']).to eq(0.0)
      expect(json_body['categories']).to eq([])
    end

    it 'returns 404 for invalid token' do
      get '/api/v1/embed/budget.json', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
    end

    it 'shows top 8 categories sorted by spending' do
      share_token = create(:share_token, user: user, widget_type: 'budget')
      account = create(:account, household: household)

      10.times do |i|
        cat = create(:category, household: household)
        create(:budget_item, budget: budget, category: cat, month: Date.current.beginning_of_month, amount_cents: 10_000)
        create(:transaction, household: household, account: account, category: cat,
               date: Date.current, amount_cents: -(1000 * (i + 1)))
      end

      get '/api/v1/embed/budget.json', params: { token: share_token.token }
      expect(json_body['categories'].length).to eq(8)
      # Verify sorted by spending descending
      amounts = json_body['categories'].map { |c| c['spent'] }
      expect(amounts).to eq(amounts.sort.reverse)
    end
  end

  describe 'GET /api/v1/docs' do
    it 'returns API documentation HTML' do
      get '/api/v1/docs'
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/html')
      expect(response.body).to include('OpenFinance Public API')
      expect(response.body).to include('X-Api-Key')
      expect(response.body).to include('Embeddable Widgets')
      expect(response.body).to include('/api/v1/embed/budget')
    end
  end

  describe 'ShareToken model' do
    it 'allows budget widget_type' do
      token = build(:share_token, user: user, widget_type: 'budget')
      expect(token).to be_valid
    end

    it 'rejects invalid widget_type' do
      token = build(:share_token, user: user, widget_type: 'invalid')
      expect(token).not_to be_valid
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end

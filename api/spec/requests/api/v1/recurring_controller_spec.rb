require 'rails_helper'

RSpec.describe "Api::V1::Recurring", type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe "GET /api/v1/recurring" do
    it "returns recurring items for the household" do
      create(:recurring_item, household: household, name: "Netflix", amount_cents: 1599, frequency: 'monthly')
      create(:recurring_item, household: household, name: "Salary", amount_cents: 500000, frequency: 'monthly', is_income: true)

      get '/api/v1/recurring', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to eq(2)
      expect(json['recurring_items'].map { |i| i['name'] }).to contain_exactly('Netflix', 'Salary')
      expect(json['summary']).to include('monthly_expenses', 'monthly_income')
    end

    it "filters by status=active" do
      create(:recurring_item, household: household, name: "Active Sub")
      create(:recurring_item, :inactive, household: household, name: "Cancelled Sub")

      get '/api/v1/recurring', headers: headers, params: { status: 'active' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['recurring_items'].first['name']).to eq('Active Sub')
    end

    it "filters by type=income" do
      create(:recurring_item, household: household, name: "Netflix")
      create(:recurring_item, :income, household: household, name: "Salary")

      get '/api/v1/recurring', headers: headers, params: { type: 'income' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['recurring_items'].first['name']).to eq('Salary')
    end

    it "includes status field with correct values" do
      create(:recurring_item, :overdue, household: household, name: "Overdue Bill")
      create(:recurring_item, :due_soon, household: household, name: "Upcoming Bill")

      get '/api/v1/recurring', headers: headers

      json = JSON.parse(response.body)
      statuses = json['recurring_items'].map { |i| [i['name'], i['status']] }.to_h
      expect(statuses['Overdue Bill']).to eq('overdue')
      expect(statuses['Upcoming Bill']).to eq('upcoming')
    end

    it "returns 401 without API key" do
      get '/api/v1/recurring'
      expect(response).to have_http_status(:unauthorized)
    end

    it "does not return items from other households" do
      other_user = create(:user)
      create(:recurring_item, household: other_user.household, name: "Other's Bill")
      create(:recurring_item, household: household, name: "My Bill")

      get '/api/v1/recurring', headers: headers

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['recurring_items'].first['name']).to eq('My Bill')
    end
  end
end

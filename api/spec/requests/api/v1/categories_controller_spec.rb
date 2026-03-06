require 'rails_helper'

RSpec.describe "Api::V1::Categories", type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe "GET /api/v1/categories" do
    it "returns all categories for the household" do
      create(:category, household: household, name: "Groceries", group_name: "Food & Drink")
      create(:category, household: household, name: "Salary", group_name: "Income", is_income: true)

      get '/api/v1/categories', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to eq(2)
      expect(json['categories'].map { |c| c['name'] }).to contain_exactly('Groceries', 'Salary')
      expect(json['groups']).to include('Food & Drink' => 1, 'Income' => 1)
    end

    it "filters by group" do
      create(:category, household: household, name: "Groceries", group_name: "Food & Drink")
      create(:category, household: household, name: "Rent", group_name: "Housing")

      get '/api/v1/categories', headers: headers, params: { group: 'Food & Drink' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['categories'].first['name']).to eq('Groceries')
    end

    it "filters by type=income" do
      create(:category, household: household, name: "Groceries")
      create(:category, :income, household: household, name: "Salary")

      get '/api/v1/categories', headers: headers, params: { type: 'income' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['categories'].first['name']).to eq('Salary')
    end

    it "includes transaction count" do
      cat = create(:category, household: household, name: "Groceries")
      account = create(:account, household: household)
      create(:transaction, household: household, account: account, category: cat)
      create(:transaction, household: household, account: account, category: cat)

      get '/api/v1/categories', headers: headers

      json = JSON.parse(response.body)
      groceries = json['categories'].find { |c| c['name'] == 'Groceries' }
      expect(groceries['transaction_count']).to eq(2)
    end

    it "returns 401 without API key" do
      get '/api/v1/categories'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

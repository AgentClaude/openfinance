require 'rails_helper'

RSpec.describe "Api::V1::Goals", type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe "GET /api/v1/goals" do
    it "returns goals for the household" do
      create(:goal, household: household, name: "Emergency Fund", target_amount_cents: 1000000, current_amount_cents: 500000, target_date: 6.months.from_now)

      get '/api/v1/goals', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)

      goal = json['goals'].first
      expect(goal['name']).to eq('Emergency Fund')
      expect(goal['target_amount']).to eq(10000.0)
      expect(goal['current_amount']).to eq(5000.0)
      expect(goal['progress_percentage']).to eq(50.0)
      expect(goal['is_achieved']).to be false
    end

    it "filters by status=active" do
      create(:goal, household: household, name: "Active Goal", target_amount_cents: 100000, target_date: 1.year.from_now)
      create(:goal, household: household, name: "Achieved Goal", target_amount_cents: 100000, current_amount_cents: 100000, is_achieved: true, target_date: 1.month.from_now)

      get '/api/v1/goals', headers: headers, params: { status: 'active' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['goals'].first['name']).to eq('Active Goal')
    end

    it "filters by status=achieved" do
      create(:goal, household: household, name: "Active Goal", target_amount_cents: 100000, target_date: 1.year.from_now)
      create(:goal, household: household, name: "Done Goal", target_amount_cents: 100000, current_amount_cents: 100000, is_achieved: true, target_date: 1.month.from_now)

      get '/api/v1/goals', headers: headers, params: { status: 'achieved' }

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
      expect(json['goals'].first['name']).to eq('Done Goal')
    end

    it "includes on_track and overdue fields" do
      create(:goal, household: household, name: "On Track", target_amount_cents: 100000, current_amount_cents: 80000, target_date: 1.year.from_now)

      get '/api/v1/goals', headers: headers

      json = JSON.parse(response.body)
      goal = json['goals'].first
      expect(goal).to have_key('on_track')
      expect(goal).to have_key('overdue')
    end

    it "returns 401 without API key" do
      get '/api/v1/goals'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

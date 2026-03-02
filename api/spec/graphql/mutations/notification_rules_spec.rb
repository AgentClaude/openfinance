require 'rails_helper'

RSpec.describe 'NotificationRule mutations', type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:headers) { auth_headers(user) }

  def execute_graphql(query, variables: {})
    post '/graphql', params: { query: query, variables: variables }.to_json,
         headers: headers.merge('Content-Type' => 'application/json')
    JSON.parse(response.body)
  end

  describe 'createNotificationRule' do
    it 'creates a notification rule' do
      query = <<~GQL
        mutation($name: String!, $ruleType: String!, $conditions: JSON!) {
          createNotificationRule(name: $name, ruleType: $ruleType, conditions: $conditions) {
            notificationRule { id name ruleType isActive conditions }
            errors
          }
        }
      GQL

      json = execute_graphql(query, variables: {
        name: 'Big Spend Alert',
        ruleType: 'large_transaction',
        conditions: { amount_threshold_cents: 50000 }
      })

      rule = json.dig('data', 'createNotificationRule', 'notificationRule')
      expect(rule).to be_present
      expect(rule['name']).to eq('Big Spend Alert')
      expect(rule['ruleType']).to eq('large_transaction')
      expect(rule['isActive']).to be true
    end
  end

  describe 'updateNotificationRule' do
    let!(:rule) { NotificationRule.create!(user: user, household: household, name: 'Test', rule_type: 'large_transaction', conditions: { 'amount_threshold_cents' => 50000 }) }

    it 'toggles active state' do
      query = <<~GQL
        mutation($id: ID!, $isActive: Boolean) {
          updateNotificationRule(id: $id, isActive: $isActive) {
            notificationRule { id isActive }
            errors
          }
        }
      GQL

      json = execute_graphql(query, variables: { id: rule.id, isActive: false })
      expect(json.dig('data', 'updateNotificationRule', 'notificationRule', 'isActive')).to be false
    end
  end

  describe 'deleteNotificationRule' do
    let!(:rule) { NotificationRule.create!(user: user, household: household, name: 'Test', rule_type: 'large_transaction', conditions: { 'amount_threshold_cents' => 50000 }) }

    it 'deletes the rule' do
      query = <<~GQL
        mutation($id: ID!) {
          deleteNotificationRule(id: $id) {
            success
            errors
          }
        }
      GQL

      expect {
        execute_graphql(query, variables: { id: rule.id })
      }.to change(NotificationRule, :count).by(-1)
    end
  end
end

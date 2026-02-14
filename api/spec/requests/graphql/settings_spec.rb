require 'rails_helper'

RSpec.describe 'Settings GraphQL', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers(user) }

  describe 'updateHousehold mutation' do
    let(:query) do
      <<~GQL
        mutation($name: String, $currency: String) {
          updateHousehold(name: $name, currency: $currency) {
            household { id name currency }
            errors
          }
        }
      GQL
    end

    it 'updates household name' do
      post '/graphql', params: { query: query, variables: { name: 'New Name' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body).dig('data', 'updateHousehold')
      expect(data['errors']).to be_empty
      expect(data['household']['name']).to eq('New Name')
    end
  end

  describe 'updateNotificationPreference mutation' do
    let(:query) do
      <<~GQL
        mutation($notificationType: String!, $channel: String!, $enabled: Boolean!) {
          updateNotificationPreference(notificationType: $notificationType, channel: $channel, enabled: $enabled) {
            notificationPreference { id notificationType channel enabled }
            errors
          }
        }
      GQL
    end

    it 'creates/updates a notification preference' do
      post '/graphql', params: {
        query: query,
        variables: { notificationType: 'budget_exceeded', channel: 'email', enabled: true }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body).dig('data', 'updateNotificationPreference')
      expect(data['errors']).to be_empty
      expect(data['notificationPreference']['enabled']).to be true
    end
  end

  describe 'notificationPreferences query' do
    let(:query) do
      <<~GQL
        query {
          notificationPreferences { id notificationType channel enabled }
        }
      GQL
    end

    it 'returns default preferences' do
      post '/graphql', params: { query: query }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      prefs = JSON.parse(response.body).dig('data', 'notificationPreferences')
      expect(prefs.length).to eq(15) # 5 types × 3 channels
    end
  end

  describe 'updateTag mutation' do
    let!(:tag) { create(:tag, household: user.household, name: 'old-name', color_hex: '#FF0000') }
    let(:query) do
      <<~GQL
        mutation($id: ID!, $name: String) {
          updateTag(id: $id, name: $name) { id name }
        }
      GQL
    end

    it 'updates tag name' do
      post '/graphql', params: { query: query, variables: { id: tag.id, name: 'new-name' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body).dig('data', 'updateTag')
      expect(data['name']).to eq('new-name')
    end
  end

  describe 'deleteTag mutation' do
    let!(:tag) { create(:tag, household: user.household, name: 'doomed', color_hex: '#FF0000') }
    let(:query) do
      <<~GQL
        mutation($id: ID!) {
          deleteTag(id: $id) { success }
        }
      GQL
    end

    it 'deletes the tag' do
      post '/graphql', params: { query: query, variables: { id: tag.id } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'deleteTag', 'success')).to be true
      expect(Tag.find_by(id: tag.id)).to be_nil
    end
  end

end

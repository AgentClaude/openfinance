# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreateShareToken do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($widgetType: String!, $expiresInDays: Int) {
        createShareToken(widgetType: $widgetType, expiresInDays: $expiresInDays) {
          shareToken {
            id
            token
            widgetType
            config
            expiresAt
            createdAt
          }
          errors
        }
      }
    GRAPHQL
  end

  def execute(current_user:, widget_type: 'net_worth', expires_in_days: nil)
    vars = { widgetType: widget_type }
    vars[:expiresInDays] = expires_in_days if expires_in_days
    OpenfinanceSchema.execute(
      mutation,
      variables: vars,
      context: { current_user: current_user }
    )
  end

  context 'authenticated' do
    it 'creates a share token for net_worth' do
      result = execute(current_user: user)
      data = result['data']['createShareToken']
      expect(data['errors']).to be_empty
      expect(data['shareToken']['widgetType']).to eq('net_worth')
      expect(data['shareToken']['token']).to be_present
      expect(data['shareToken']['expiresAt']).to be_nil
    end

    it 'creates a share token with expiry' do
      result = execute(current_user: user, expires_in_days: 30)
      data = result['data']['createShareToken']
      expect(data['errors']).to be_empty
      expect(data['shareToken']['expiresAt']).to be_present
    end

    it 'rejects invalid widget type' do
      result = execute(current_user: user, widget_type: 'invalid')
      data = result['data']['createShareToken']
      expect(data['shareToken']).to be_nil
      expect(data['errors']).to be_present
    end
  end

  context 'unauthenticated' do
    it 'returns authentication error' do
      result = execute(current_user: nil)
      data = result['data']['createShareToken']
      expect(data['shareToken']).to be_nil
      expect(data['errors']).to include('Not authenticated')
    end
  end
end

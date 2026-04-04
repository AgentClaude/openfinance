# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'accounts query includeHidden argument' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:visible_account) { create(:account, household: household, name: 'Visible Checking', is_hidden: false) }
  let!(:hidden_account) { create(:account, household: household, name: 'Hidden Savings', is_hidden: true) }

  let(:query) do
    <<~GQL
      query GetAccounts($includeHidden: Boolean) {
        accounts(includeHidden: $includeHidden) {
          id
          name
          isHidden
        }
      }
    GQL
  end

  def execute(variables = {})
    OpenfinanceSchema.execute(query, variables: variables, context: { current_user: user })
  end

  it 'excludes hidden accounts by default' do
    result = execute
    names = result.dig('data', 'accounts').map { |a| a['name'] }
    expect(names).to include('Visible Checking')
    expect(names).not_to include('Hidden Savings')
  end

  it 'includes hidden accounts when requested' do
    result = execute(includeHidden: true)
    names = result.dig('data', 'accounts').map { |a| a['name'] }
    expect(names).to include('Visible Checking')
    expect(names).to include('Hidden Savings')
  end

  it 'marks hidden accounts correctly' do
    result = execute(includeHidden: true)
    hidden = result.dig('data', 'accounts').find { |a| a['name'] == 'Hidden Savings' }
    expect(hidden['isHidden']).to be true
  end
end

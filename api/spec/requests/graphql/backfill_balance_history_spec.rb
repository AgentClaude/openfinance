require 'rails_helper'

RSpec.describe 'BackfillBalanceHistory mutation', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:visible_account) { create(:account, household: household, name: "Checking", current_balance_cents: 100_000) }
  let!(:hidden_account) { create(:account, household: household, name: "Old Card", current_balance_cents: 50_000, is_hidden: true) }

  let(:query) do
    <<~GRAPHQL
      mutation($months: Int) {
        backfillBalanceHistory(months: $months) {
          accountsProcessed
          snapshotsCreated
        }
      }
    GRAPHQL
  end

  it "requires authentication" do
    result = graphql_query(query, variables: { months: 3 })
    errors = result['errors']
    expect(errors).to be_present
  end

  it "backfills balance history for non-hidden accounts" do
    result = graphql_query(query, variables: { months: 3 }, user: user)
    data = result.dig('data', 'backfillBalanceHistory')

    expect(data['accountsProcessed']).to eq(1)
    expect(data['snapshotsCreated']).to be > 0
  end

  it "excludes hidden accounts" do
    graphql_query(query, variables: { months: 3 }, user: user)

    expect(AccountBalanceHistory.where(account: hidden_account).count).to eq(0)
    expect(AccountBalanceHistory.where(account: visible_account).count).to be > 0
  end

  it "defaults to 12 months" do
    result = graphql_query(query, variables: {}, user: user)
    data = result.dig('data', 'backfillBalanceHistory')

    expect(data['accountsProcessed']).to eq(1)
    expect(data['snapshotsCreated']).to eq(13) # today + 12 months
  end

  it "is idempotent on second run" do
    graphql_query(query, variables: { months: 3 }, user: user)
    result = graphql_query(query, variables: { months: 3 }, user: user)

    data = result.dig('data', 'backfillBalanceHistory')
    expect(data['snapshotsCreated']).to eq(0)
  end
end

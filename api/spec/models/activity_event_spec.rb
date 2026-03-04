# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ActivityEvent, type: :model do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      event = ActivityEvent.new(
        household: household,
        user: user,
        action: 'categorized',
        resource_type: 'Transaction',
        resource_id: SecureRandom.uuid
      )
      expect(event).to be_valid
    end

    it 'requires action' do
      event = ActivityEvent.new(household: household, user: user, resource_type: 'Transaction')
      expect(event).not_to be_valid
      expect(event.errors[:action]).to include("can't be blank")
    end

    it 'requires resource_type' do
      event = ActivityEvent.new(household: household, user: user, action: 'created')
      expect(event).not_to be_valid
      expect(event.errors[:resource_type]).to include("can't be blank")
    end

    it 'validates action inclusion' do
      event = ActivityEvent.new(
        household: household,
        user: user,
        action: 'invalid_action',
        resource_type: 'Transaction'
      )
      expect(event).not_to be_valid
    end
  end

  describe '.log' do
    it 'creates an activity event' do
      expect {
        ActivityEvent.log(
          user: user,
          action: 'categorized',
          resource: build_stubbed(:transaction, household: household),
          metadata: { category_name: 'Food' }
        )
      }.to change(ActivityEvent, :count).by(1)

      event = ActivityEvent.last
      expect(event.action).to eq('categorized')
      expect(event.resource_type).to eq('Transaction')
      expect(event.metadata['category_name']).to eq('Food')
      expect(event.household).to eq(household)
    end

    it 'accepts a string resource_type' do
      ActivityEvent.log(
        user: user,
        action: 'invited',
        resource: 'Invitation',
        metadata: { email: 'test@example.com' }
      )
      expect(ActivityEvent.last.resource_type).to eq('Invitation')
      expect(ActivityEvent.last.resource_id).to be_nil
    end

    it 'does not raise on validation failure' do
      expect {
        ActivityEvent.log(
          user: user,
          action: 'invalid_action',
          resource: 'Unknown'
        )
      }.not_to raise_error
    end

    it 'returns nil if user has no household' do
      orphan = build(:user, household: nil)
      result = ActivityEvent.log(user: orphan, action: 'created', resource: 'Transaction')
      expect(result).to be_nil
    end
  end

  describe '#description' do
    it 'returns human-readable description for categorized' do
      event = ActivityEvent.new(action: 'categorized', resource_type: 'Transaction', metadata: { 'category_name' => 'Food' })
      expect(event.description).to eq('categorized a transaction as Food')
    end

    it 'returns human-readable description for invited' do
      event = ActivityEvent.new(action: 'invited', resource_type: 'Invitation', metadata: { 'email' => 'test@example.com' })
      expect(event.description).to eq('invited test@example.com to the household')
    end

    it 'returns human-readable description for goal_created' do
      event = ActivityEvent.new(action: 'goal_created', resource_type: 'Goal', metadata: { 'goal_name' => 'Emergency Fund' })
      expect(event.description).to eq('created goal: Emergency Fund')
    end
  end

  describe 'scopes' do
    before do
      ActivityEvent.create!(household: household, user: user, action: 'created', resource_type: 'Transaction', created_at: 2.hours.ago)
      ActivityEvent.create!(household: household, user: user, action: 'categorized', resource_type: 'Transaction', created_at: 1.hour.ago)
      ActivityEvent.create!(household: household, user: user, action: 'budget_set', resource_type: 'BudgetItem', created_at: 30.minutes.ago)
    end

    it '.recent orders by created_at desc' do
      events = ActivityEvent.recent
      expect(events.first.action).to eq('budget_set')
      expect(events.last.action).to eq('created')
    end

    it '.since filters by time' do
      events = ActivityEvent.since(90.minutes.ago)
      expect(events.count).to eq(2)
    end
  end
end

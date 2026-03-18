require 'rails_helper'

RSpec.describe GoalMilestone, type: :model do
  let(:household) { create(:household) }
  let(:goal) { create(:goal, household: household, target_amount_cents: 100000, current_amount_cents: 50000) }

  describe 'associations' do
    it { is_expected.to belong_to(:goal) }
  end

  describe 'validations' do
    subject { build(:goal_milestone, goal: goal) }

    it { is_expected.to validate_presence_of(:percentage) }
    it { is_expected.to validate_presence_of(:amount_at_milestone_cents) }
    it { is_expected.to validate_presence_of(:achieved_at) }

    it 'validates percentage is a valid milestone' do
      milestone = build(:goal_milestone, goal: goal, percentage: 30)
      expect(milestone).not_to be_valid
      expect(milestone.errors[:percentage]).to be_present
    end

    it 'validates uniqueness of percentage per goal' do
      create(:goal_milestone, goal: goal, percentage: 25)
      duplicate = build(:goal_milestone, goal: goal, percentage: 25)
      expect(duplicate).not_to be_valid
    end

    it 'allows same percentage on different goals' do
      other_goal = create(:goal, household: household)
      create(:goal_milestone, goal: goal, percentage: 25)
      other_milestone = build(:goal_milestone, goal: other_goal, percentage: 25)
      expect(other_milestone).to be_valid
    end
  end

  describe '#label' do
    it 'returns appropriate labels for each percentage' do
      expect(build(:goal_milestone, percentage: 25).label).to eq("Quarter way there!")
      expect(build(:goal_milestone, percentage: 50).label).to eq("Halfway there!")
      expect(build(:goal_milestone, percentage: 75).label).to eq("Almost there!")
      expect(build(:goal_milestone, percentage: 100).label).to eq("Goal achieved! 🎉")
    end
  end

  describe '#emoji' do
    it 'returns appropriate emoji for each percentage' do
      expect(build(:goal_milestone, percentage: 25).emoji).to eq("🌱")
      expect(build(:goal_milestone, percentage: 50).emoji).to eq("⚡")
      expect(build(:goal_milestone, percentage: 75).emoji).to eq("🔥")
      expect(build(:goal_milestone, percentage: 100).emoji).to eq("🎉")
    end
  end

  describe '#amount_at_milestone' do
    it 'returns amount in dollars' do
      milestone = build(:goal_milestone, amount_at_milestone_cents: 50000)
      expect(milestone.amount_at_milestone).to eq(500.0)
    end
  end

  describe 'scopes' do
    before do
      create(:goal_milestone, goal: goal, percentage: 50, achieved_at: 1.day.ago)
      create(:goal_milestone, goal: goal, percentage: 25, achieved_at: 2.days.ago)
    end

    it '.ordered returns milestones by percentage ascending' do
      milestones = goal.milestones.ordered
      expect(milestones.map(&:percentage)).to eq([25, 50])
    end

    it '.recent_first returns milestones by achieved_at descending' do
      milestones = goal.milestones.recent_first
      expect(milestones.first.percentage).to eq(50)
    end
  end
end

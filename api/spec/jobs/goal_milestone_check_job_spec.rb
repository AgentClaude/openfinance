require 'rails_helper'

RSpec.describe GoalMilestoneCheckJob, type: :job do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }

  describe '#perform' do
    context 'when goal is at 30% progress' do
      let!(:goal) do
        create(:goal, household: household,
               target_amount_cents: 100000,
               current_amount_cents: 30000)
      end

      it 'creates the 25% milestone' do
        expect { described_class.new.perform }.to change { GoalMilestone.count }.by(1)
        milestone = goal.milestones.first
        expect(milestone.percentage).to eq(25)
        expect(milestone.amount_at_milestone_cents).to eq(30000)
      end

      it 'creates a goal_progress notification' do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notification = Notification.last
        expect(notification.notification_type).to eq('goal_progress')
        expect(notification.title).to include('25%')
        expect(notification.data['milestone_percentage']).to eq(25)
      end
    end

    context 'when goal is at 55% progress' do
      let!(:goal) do
        create(:goal, household: household,
               target_amount_cents: 100000,
               current_amount_cents: 55000)
      end

      it 'creates both 25% and 50% milestones' do
        expect { described_class.new.perform }.to change { GoalMilestone.count }.by(2)
        percentages = goal.milestones.ordered.pluck(:percentage)
        expect(percentages).to eq([25, 50])
      end
    end

    context 'when milestone already exists' do
      let!(:goal) do
        create(:goal, household: household,
               target_amount_cents: 100000,
               current_amount_cents: 55000)
      end

      before do
        create(:goal_milestone, goal: goal, percentage: 25, amount_at_milestone_cents: 25000)
      end

      it 'only creates new milestones' do
        expect { described_class.new.perform }.to change { GoalMilestone.count }.by(1)
        new_milestone = goal.milestones.find_by(percentage: 50)
        expect(new_milestone).to be_present
      end
    end

    context 'when goal reaches 100%' do
      let!(:goal) do
        # Goal at 99% first — not yet achieved
        g = create(:goal, household: household,
                   target_amount_cents: 100000,
                   current_amount_cents: 99000)
        # Now push to 100% — is_achieved gets set by callback but we keep is_active
        g.update_columns(current_amount_cents: 100000)
        g
      end

      it 'creates all milestones' do
        expect { described_class.new.perform }.to change { GoalMilestone.count }.by(4)
      end

      it 'creates a high priority notification for 100%' do
        described_class.new.perform
        notification = Notification.where("data->>'milestone_percentage' = '100'").last
        expect(notification).to be_present
        expect(notification.priority).to eq('high')
        expect(notification.title).to include('achieved')
      end
    end

    context 'with inactive goal' do
      let!(:goal) do
        create(:goal, household: household,
               target_amount_cents: 100000,
               current_amount_cents: 50000,
               is_active: false)
      end

      it 'skips inactive goals' do
        expect { described_class.new.perform }.not_to change { GoalMilestone.count }
      end
    end

    context 'with achieved goal' do
      let!(:goal) do
        create(:goal, :achieved, household: household,
               target_amount_cents: 100000)
      end

      it 'skips achieved goals' do
        expect { described_class.new.perform }.not_to change { GoalMilestone.count }
      end
    end

    context 'with zero target amount' do
      let!(:goal) do
        # Use build + save(validate: false) to bypass validation
        g = build(:goal, household: household,
                  target_amount_cents: 0,
                  current_amount_cents: 0)
        g.save(validate: false)
        g
      end

      it 'skips goals with zero target' do
        expect { described_class.new.perform }.not_to change { GoalMilestone.count }
      end
    end

    context 'with multiple users in household' do
      let!(:user2) { create(:user, household: household) }
      let!(:goal) do
        create(:goal, household: household,
               target_amount_cents: 100000,
               current_amount_cents: 30000)
      end

      it 'creates notifications for all household users' do
        expect { described_class.new.perform }.to change { Notification.count }.by(2)
      end
    end
  end
end

require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }

  describe "#perform" do
    context "with a bill due tomorrow" do
      before do
        create(:recurring_item, household: household, name: "Netflix",
               item_type: "expense", amount_cents: -1599, frequency: "monthly",
               start_date: 1.month.ago, next_occurrence: Date.tomorrow, is_active: true)
      end

      it "creates a reminder notification" do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notif = Notification.last
        expect(notif.title).to include("Netflix")
        expect(notif.title).to include("1 day")
      end
    end

    context "with a bill due today" do
      before do
        create(:recurring_item, household: household, name: "Rent",
               item_type: "expense", amount_cents: -150_000, frequency: "monthly",
               start_date: 1.month.ago, next_occurrence: Date.current, is_active: true)
      end

      it "creates a high-priority notification" do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notif = Notification.last
        expect(notif.title).to include("due today")
        expect(notif.priority).to eq("high")
      end
    end

    context "with a bill due in 5 days (outside window)" do
      before do
        create(:recurring_item, household: household, name: "Insurance",
               item_type: "expense", amount_cents: -20_000, frequency: "monthly",
               start_date: 1.month.ago, next_occurrence: Date.current + 5.days, is_active: true)
      end

      it "does not create a notification" do
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end

    context "deduplication" do
      before do
        create(:recurring_item, household: household, name: "Netflix",
               item_type: "expense", amount_cents: -1599, frequency: "monthly",
               start_date: 1.month.ago, next_occurrence: Date.tomorrow, is_active: true)
      end

      it "does not create duplicate reminders" do
        described_class.new.perform
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end
  end
end

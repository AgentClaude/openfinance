require 'rails_helper'

RSpec.describe BudgetAlertJob, type: :job do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }
  let!(:budget) { create(:budget, household: household, is_active: true) }
  let!(:category) { create(:category, household: household, name: "Dining") }
  let!(:account) { create(:account, household: household) }
  let(:month) { Date.current.beginning_of_month }

  before do
    # Create a budget item for $500
    create(:budget_item, budget: budget, category: category, month: month, amount_cents: 50_000)
  end

  describe "#perform" do
    context "when spending is under 80%" do
      before do
        # Spend $300 of $500 (60%)
        create(:transaction, household: household, account: account, category: category,
               date: month + 5.days, amount_cents: -30_000)
      end

      it "does not create any notifications" do
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end

    context "when spending exceeds 80%" do
      before do
        # Spend $425 of $500 (85%)
        create(:transaction, household: household, account: account, category: category,
               date: month + 5.days, amount_cents: -42_500)
      end

      it "creates a warning notification" do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notif = Notification.last
        expect(notif.title).to include("Budget warning")
        expect(notif.title).to include("Dining")
        expect(notif.priority).to eq("normal")
      end
    end

    context "when spending exceeds 100%" do
      before do
        # Spend $600 of $500 (120%)
        create(:transaction, household: household, account: account, category: category,
               date: month + 5.days, amount_cents: -60_000)
      end

      it "creates an exceeded notification" do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notif = Notification.last
        expect(notif.title).to include("Budget exceeded")
        expect(notif.priority).to eq("high")
      end
    end

    context "deduplication" do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: month + 5.days, amount_cents: -60_000)
      end

      it "does not create duplicate alerts" do
        described_class.new.perform
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end

    context "when notification preference is disabled" do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: month + 5.days, amount_cents: -60_000)
        create(:notification_preference, user: user, notification_type: "budget_exceeded",
               channel: "in_app", enabled: false)
      end

      it "does not create notifications" do
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end
  end
end

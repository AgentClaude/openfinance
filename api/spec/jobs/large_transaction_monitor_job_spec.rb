require 'rails_helper'

RSpec.describe LargeTransactionMonitorJob, type: :job do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }
  let!(:account) { create(:account, household: household, name: "Checking") }

  describe "#perform" do
    context "with a large transaction" do
      before do
        create(:transaction, household: household, account: account,
               name: "Big Purchase", amount_cents: -75_000, date: Date.current)
      end

      it "creates a notification" do
        expect { described_class.new.perform }.to change { Notification.count }.by(1)
        notif = Notification.last
        expect(notif.title).to include("$750.00")
        expect(notif.body).to include("Big Purchase")
        expect(notif.notification_type).to eq("large_transaction")
        expect(notif.priority).to eq("high")
      end
    end

    context "with a normal transaction" do
      before do
        create(:transaction, household: household, account: account,
               name: "Coffee", amount_cents: -450, date: Date.current)
      end

      it "does not create a notification" do
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end

    context "with an old large transaction" do
      before do
        create(:transaction, household: household, account: account,
               name: "Old Purchase", amount_cents: -75_000, date: Date.current,
               created_at: 2.days.ago)
      end

      it "does not create a notification (outside 24h window)" do
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end

    context "deduplication" do
      before do
        create(:transaction, household: household, account: account,
               name: "Big Purchase", amount_cents: -75_000, date: Date.current)
      end

      it "does not create duplicate alerts" do
        described_class.new.perform
        expect { described_class.new.perform }.not_to change { Notification.count }
      end
    end
  end
end

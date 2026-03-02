require 'rails_helper'

RSpec.describe EmailNotificationService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe '.deliver_alert' do
    let(:notification) do
      Notification.create!(
        user: user,
        household: household,
        title: 'Test Alert',
        body: 'Test body',
        notification_type: 'budget_alert',
        priority: 'normal'
      )
    end

    context 'when email is enabled for the notification type' do
      before do
        create(:notification_preference,
          user: user,
          notification_type: 'budget_exceeded',
          channel: 'email',
          enabled: true
        )
      end

      it 'enqueues an alert email' do
        expect {
          described_class.deliver_alert(notification)
        }.to have_enqueued_mail(NotificationMailer, :alert_email).with(notification)
      end
    end

    context 'when email is disabled for the notification type' do
      before do
        create(:notification_preference,
          user: user,
          notification_type: 'budget_exceeded',
          channel: 'email',
          enabled: false
        )
      end

      it 'does not enqueue an email' do
        expect {
          described_class.deliver_alert(notification)
        }.not_to have_enqueued_mail(NotificationMailer, :alert_email)
      end
    end

    context 'when no preference exists' do
      it 'does not enqueue an email (default off)' do
        expect {
          described_class.deliver_alert(notification)
        }.not_to have_enqueued_mail(NotificationMailer, :alert_email)
      end
    end
  end

  describe '.check_budget_alerts' do
    let(:category) { create(:category, household: household, name: 'Food', group_name: 'Food & Drink') }
    let(:account) { create(:account, household: household) }
    let!(:budget) { Budget.create!(household: household, name: 'Monthly', period_type: 'monthly', start_date: Date.current.beginning_of_month) }
    let!(:budget_item) do
      BudgetItem.create!(
        budget: budget,
        category: category,
        month: Date.current.beginning_of_month,
        amount_cents: 50000 # $500
      )
    end

    before do
      create(:notification_preference, user: user, notification_type: 'budget_exceeded', channel: 'email', enabled: true)
    end

    context 'when spending exceeds 90% of budget' do
      before do
        # Create transactions totaling $460 (92%)
        create(:transaction, household: household, account: account, category: category,
               date: Date.current, amount_cents: -46000)
      end

      it 'sends a budget alert email' do
        expect {
          described_class.check_budget_alerts(household)
        }.to have_enqueued_mail(NotificationMailer, :budget_alert_email)
      end

      it 'creates an in-app notification' do
        expect {
          described_class.check_budget_alerts(household)
        }.to change(Notification, :count).by(1)
      end
    end

    context 'when spending is under 90%' do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: Date.current, amount_cents: -20000) # $200 = 40%
      end

      it 'does not send an alert' do
        expect {
          described_class.check_budget_alerts(household)
        }.not_to have_enqueued_mail(NotificationMailer, :budget_alert_email)
      end
    end
  end

  describe '.check_bill_reminders' do
    let(:account) { create(:account, household: household) }

    before do
      create(:notification_preference, user: user, notification_type: 'bill_due', channel: 'email', enabled: true)
    end

    context 'with upcoming bills' do
      let!(:bill) do
        create(:recurring_item, household: household, name: 'Netflix',
               next_occurrence: 2.days.from_now.to_date, is_active: true, amount_cents: 1599)
      end

      it 'sends a bill reminder email' do
        expect {
          described_class.check_bill_reminders(household)
        }.to have_enqueued_mail(NotificationMailer, :bill_reminder_email)
      end

      it 'does not send duplicate reminders on same day' do
        described_class.check_bill_reminders(household)

        expect {
          described_class.check_bill_reminders(household)
        }.not_to have_enqueued_mail(NotificationMailer, :bill_reminder_email)
      end
    end

    context 'with no upcoming bills' do
      it 'does not send an email' do
        expect {
          described_class.check_bill_reminders(household)
        }.not_to have_enqueued_mail(NotificationMailer, :bill_reminder_email)
      end
    end
  end

  describe '.send_weekly_digest' do
    let(:account) { create(:account, household: household) }
    let(:category) { create(:category, household: household) }

    before do
      create(:notification_preference, user: user, notification_type: 'weekly_digest', channel: 'email', enabled: true)
      # Create some transactions for the week
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -5000)
      create(:transaction, :income, household: household, account: account,
             date: Date.current, amount_cents: 200000)
    end

    it 'sends a weekly digest email' do
      expect {
        described_class.send_weekly_digest(household)
      }.to have_enqueued_mail(NotificationMailer, :weekly_digest)
    end

    context 'when digest is disabled' do
      before do
        user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
            .update!(enabled: false)
      end

      it 'does not send a digest' do
        expect {
          described_class.send_weekly_digest(household)
        }.not_to have_enqueued_mail(NotificationMailer, :weekly_digest)
      end
    end
  end

  describe '.build_digest_data' do
    let(:account) { create(:account, household: household) }
    let(:category) { create(:category, household: household, name: 'Groceries') }
    let(:week_start) { Date.current - 6.days }
    let(:week_end) { Date.current }

    before do
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -15000)
      create(:transaction, :income, household: household, account: account,
             date: Date.current, amount_cents: 300000)
    end

    it 'returns correct digest structure' do
      data = described_class.send(:build_digest_data, household, week_start, week_end)

      expect(data).to include(
        :week_start, :week_end, :income, :expenses, :cash_flow,
        :net_worth, :top_categories, :budget_status, :upcoming_bills,
        :transaction_count
      )
      expect(data[:income]).to eq(3000.0)
      expect(data[:expenses]).to eq(150.0)
      expect(data[:cash_flow]).to eq(2850.0)
      expect(data[:transaction_count]).to eq(2)
      expect(data[:top_categories].first[:name]).to eq('Groceries')
    end
  end
end

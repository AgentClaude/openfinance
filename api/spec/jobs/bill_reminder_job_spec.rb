require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  let!(:household) { Household.create!(name: 'Test') }
  let!(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User', household: household) }

  it 'enqueues on default queue' do
    expect(described_class.new.queue_name).to eq('default')
  end

  it 'sends reminder when bills are due soon' do
    RecurringItem.create!(
      name: 'Netflix', amount_cents: -1599, item_type: 'expense',
      frequency: 'monthly', next_occurrence: 1.day.from_now,
      is_active: true, household: household
    )

    expect { described_class.new.perform }.to have_enqueued_mail(BillReminderMailer, :upcoming_bills)
  end

  it 'does not send when no bills are due' do
    RecurringItem.create!(
      name: 'Netflix', amount_cents: -1599, item_type: 'expense',
      frequency: 'monthly', next_occurrence: 10.days.from_now,
      is_active: true, household: household
    )

    expect { described_class.new.perform }.not_to have_enqueued_mail(BillReminderMailer, :upcoming_bills)
  end

  it 'creates in-app notifications for upcoming bills' do
    RecurringItem.create!(
      name: 'Rent', amount_cents: -150000, item_type: 'expense',
      frequency: 'monthly', next_occurrence: Date.tomorrow,
      is_active: true, household: household
    )

    expect { described_class.new.perform }.to change(Notification, :count).by(1)
  end

  it 'skips users who disabled bill reminders' do
    NotificationPreference.create!(user: user, notification_type: 'bill_due', channel: 'email', enabled: false)
    RecurringItem.create!(
      name: 'Netflix', amount_cents: -1599, item_type: 'expense',
      frequency: 'monthly', next_occurrence: 1.day.from_now,
      is_active: true, household: household
    )

    expect { described_class.new.perform }.not_to have_enqueued_mail(BillReminderMailer, :upcoming_bills)
  end
end

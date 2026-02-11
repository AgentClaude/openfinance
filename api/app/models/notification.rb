class Notification < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :household

  # Validations
  validates :title, presence: true, length: { minimum: 1, maximum: 255 }
  validates :body, length: { maximum: 1000 }
  validates :notification_type, presence: true
  validates :priority, inclusion: { in: %w[low normal high] }

  # Enums
  enum :notification_type, {
    budget_alert: 'budget_alert',
    transaction_alert: 'transaction_alert',
    sync_error: 'sync_error',
    low_balance: 'low_balance',
    large_transaction: 'large_transaction',
    goal_progress: 'goal_progress',
    account_connection: 'account_connection',
    security_alert: 'security_alert',
    system_update: 'system_update'
  }

  enum :priority, {
    low: 'low',
    normal: 'normal',
    high: 'high'
  }

  # Scopes
  scope :unread, -> { where(is_read: false) }
  scope :read, -> { where(is_read: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :scheduled, -> { where.not(scheduled_for: nil) }
  scope :ready_to_send, -> { scheduled.where('scheduled_for <= ?', Time.current) }
  scope :high_priority, -> { where(priority: 'high') }

  # Callbacks
  after_create :send_notification_if_needed
  before_destroy :cleanup_associated_data

  # Instance methods
  def mark_as_read!
    return if is_read?
    
    update!(
      is_read: true,
      read_at: Time.current
    )
  end

  def mark_as_unread!
    return unless is_read?
    
    update!(
      is_read: false,
      read_at: nil
    )
  end

  def scheduled?
    scheduled_for.present?
  end

  def ready_to_send?
    scheduled? && scheduled_for <= Time.current
  end

  def overdue?
    scheduled? && scheduled_for < Time.current
  end

  def time_since_created
    return 0 if created_at.blank?
    
    Time.current - created_at
  end

  def urgency_score
    base_score = case priority
                 when 'high' then 100
                 when 'normal' then 50
                 when 'low' then 10
                 else 50
                 end

    # Increase urgency for older notifications
    age_factor = [time_since_created / 1.hour, 5].min
    
    base_score + age_factor
  end

  # Notification content helpers
  def full_message
    return title if body.blank?
    
    "#{title}\n\n#{body}"
  end

  def truncated_body(max_length = 100)
    return body if body.blank? || body.length <= max_length
    
    "#{body[0..max_length - 3]}..."
  end

  def icon_class
    case notification_type
    when 'budget_alert' then 'fa-exclamation-triangle'
    when 'transaction_alert' then 'fa-credit-card'
    when 'sync_error' then 'fa-sync-alt'
    when 'low_balance' then 'fa-wallet'
    when 'large_transaction' then 'fa-money-bill-wave'
    when 'goal_progress' then 'fa-bullseye'
    when 'account_connection' then 'fa-link'
    when 'security_alert' then 'fa-shield-alt'
    when 'system_update' then 'fa-bell'
    else 'fa-info-circle'
    end
  end

  def color_class
    case priority
    when 'high' then 'text-red-600'
    when 'normal' then 'text-blue-600'
    when 'low' then 'text-gray-600'
    else 'text-gray-600'
    end
  end

  # Class methods
  def self.create_budget_alert(user, category, amount_spent, budget_amount)
    create!(
      user: user,
      household: user.household,
      title: "Budget Alert: #{category.name}",
      body: "You've spent $#{amount_spent/100.0} of your $#{budget_amount/100.0} budget for #{category.name}.",
      notification_type: 'budget_alert',
      priority: 'normal',
      data: {
        category_id: category.id,
        amount_spent: amount_spent,
        budget_amount: budget_amount,
        percentage: (amount_spent.to_f / budget_amount * 100).round(1)
      }
    )
  end

  def self.create_large_transaction_alert(user, transaction)
    create!(
      user: user,
      household: user.household,
      title: 'Large Transaction Detected',
      body: "A large transaction of $#{transaction.amount.abs} was recorded for #{transaction.account.name}.",
      notification_type: 'large_transaction',
      priority: 'high',
      data: {
        transaction_id: transaction.id,
        account_id: transaction.account_id,
        amount: transaction.amount_cents
      }
    )
  end

  def self.create_sync_error(user, connection, error_message)
    create!(
      user: user,
      household: user.household,
      title: 'Account Sync Error',
      body: "Failed to sync #{connection.institution.name}: #{error_message}",
      notification_type: 'sync_error',
      priority: 'high',
      data: {
        connection_id: connection.id,
        institution_name: connection.institution.name,
        error: error_message
      }
    )
  end

  # Cleanup methods
  def self.cleanup_old_notifications(older_than: 90.days)
    where('created_at < ?', older_than.ago).destroy_all
  end

  def self.mark_all_read_for_user(user)
    where(user: user, is_read: false).update_all(
      is_read: true,
      read_at: Time.current
    )
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :title, :body, :notification_type, :priority, :is_read, :read_at, :scheduled_for, :created_at, :updated_at],
      methods: [:full_message, :urgency_score, :icon_class, :color_class]
    ))
  end

  private

  def send_notification_if_needed
    # Hook for real-time notifications (websockets, push notifications, etc.)
    # This could trigger email/SMS/push notifications based on user preferences
    NotificationDeliveryJob.safe_perform_later(self) if should_send_immediately?
  end

  def should_send_immediately?
    !scheduled? || ready_to_send?
  end

  def cleanup_associated_data
    # Clean up any associated data when notification is destroyed
    # This is a placeholder for future extensions
  end
end
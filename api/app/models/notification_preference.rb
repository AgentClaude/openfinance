class NotificationPreference < ApplicationRecord
  belongs_to :user

  NOTIFICATION_TYPES = %w[budget_exceeded bill_due large_transaction weekly_digest goal_milestone].freeze
  CHANNELS = %w[in_app email push].freeze

  validates :notification_type, presence: true, inclusion: { in: NOTIFICATION_TYPES }
  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :notification_type, uniqueness: { scope: [:user_id, :channel] }

  scope :enabled, -> { where(enabled: true) }
  scope :for_type, ->(type) { where(notification_type: type) }
  scope :for_channel, ->(channel) { where(channel: channel) }

  def self.defaults_for(user)
    NOTIFICATION_TYPES.flat_map do |type|
      CHANNELS.map do |channel|
        find_or_create_by!(user: user, notification_type: type, channel: channel) do |pref|
          pref.enabled = (channel == 'in_app') # only in_app enabled by default
        end
      end
    end
  end
end

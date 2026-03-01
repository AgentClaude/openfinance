# AccountConnection model for OpenFinance
# Manages connections to financial institutions via Plaid and other providers

class AccountConnection < ApplicationRecord
  include EncryptedAttributes

  # Associations
  belongs_to :household
  belongs_to :institution, optional: true
  belongs_to :created_by, class_name: 'User'
  has_many :accounts, foreign_key: :connection_id, dependent: :destroy
  has_many :sync_logs, dependent: :destroy

  # Validations
  validates :household, presence: true
  validates :provider, presence: true, inclusion: { in: %w[plaid finicity mx manual] }
  validates :status, presence: true, inclusion: { in: %w[active error disconnected expired] }
  validates :provider_connection_id, presence: true, unless: :manual_provider?
  validates :created_by, presence: true

  # Encrypted attributes
  encrypts :provider_access_token

  # Enums
  enum :status, { 
    active: 'active',
    error: 'error', 
    disconnected: 'disconnected',
    expired: 'expired'
  }

  enum :provider, {
    plaid: 'plaid',
    finicity: 'finicity', 
    mx: 'mx',
    manual: 'manual'
  }

  # Scopes
  scope :active_connections, -> { where(status: 'active') }
  scope :needs_attention, -> { where(status: ['error', 'expired']) }
  scope :by_provider, ->(provider_name) { where(provider: provider_name) }
  scope :recently_synced, -> { where(last_synced_at: 24.hours.ago..) }
  scope :needs_sync, -> { where(last_synced_at: ...24.hours.ago).or(where(last_synced_at: nil)) }

  # Callbacks
  before_create :set_initial_status
  after_create :schedule_initial_sync
  after_update :handle_status_changes

  # Connection management
  def disconnect!
    update!(
      status: 'disconnected',
      error_code: nil,
      error_message: nil
    )
    
    # Archive accounts but don't delete them
    accounts.update_all(is_hidden: true)
    
    # Cancel any pending sync jobs
    SyncAccountsJob.cancel_for_connection(id) rescue nil
  end

  def reconnect!(new_access_token = nil)
    if new_access_token
      self.provider_access_token = new_access_token
    end
    
    update!(
      status: 'active',
      error_code: nil,
      error_message: nil
    )
    
    # Unhide accounts
    accounts.update_all(is_hidden: false)
    
    # Schedule immediate sync
    schedule_sync(priority: 'high')
  end

  def mark_error!(error_code, error_message)
    update!(
      status: 'error',
      error_code: error_code,
      error_message: error_message
    )
  end

  def mark_expired!
    update!(status: 'expired')
  end

  # Sync management
  def schedule_sync(priority: 'default')
    return unless active? && !manual_provider?
    
    SyncAccountsJob.safe_perform_later(self, set_options: { queue: priority })
  end

  def sync_in_progress?
    sync_logs.where(status: 'started', completed_at: nil)
             .where(started_at: 5.minutes.ago..)
             .exists?
  end

  def last_successful_sync
    sync_logs.where(status: 'completed').order(:completed_at).last
  end

  def sync_history(limit = 10)
    sync_logs.order(started_at: :desc).limit(limit)
  end

  def should_sync?
    return false unless active?
    return false if manual_provider?
    return false if sync_in_progress?
    
    last_synced_at.nil? || last_synced_at < sync_interval.ago
  end

  def sync_interval
    case provider
    when 'plaid'
      4.hours # More frequent for Plaid due to webhooks
    else
      6.hours # Default interval for other providers
    end
  end

  # Provider-specific methods
  def plaid_item_id
    provider_connection_id if plaid?
  end

  def provider_service
    @provider_service ||= case provider
                         when 'plaid'
                           PlaidService.new
                         when 'finicity'
                           FinicityService.new
                         when 'mx'
                           MxService.new
                         else
                           nil
                         end
  end

  # Institution information
  def institution_name
    institution&.name || 'Unknown Institution'
  end

  def institution_logo_url
    institution&.logo_url
  end

  def institution_website_url
    institution&.website_url
  end

  # Account summary
  def total_balance
    accounts.sum(:current_balance) || 0
  end

  def account_count
    accounts.count
  end

  def account_types
    accounts.pluck(:account_type).uniq
  end

  # Error handling
  def has_errors?
    error? || expired?
  end

  def error_display_message
    return nil unless has_errors?
    
    case error_code
    when 'ITEM_LOGIN_REQUIRED'
      'Please reconnect your account by logging in again'
    when 'INVALID_CREDENTIALS'
      'Your login credentials have changed. Please update them.'
    when 'INSTITUTION_DOWN'
      'Your bank is temporarily unavailable. Please try again later.'
    when 'INSUFFICIENT_CREDENTIALS'
      'Additional authentication is required. Please reconnect your account.'
    else
      error_message || 'There was an issue connecting to your account'
    end
  end

  def retryable_error?
    return false unless has_errors?
    
    retryable_codes = %w[
      INSTITUTION_DOWN
      INSTITUTION_NOT_RESPONDING
      INTERNAL_SERVER_ERROR
      PLANNED_MAINTENANCE
    ]
    
    retryable_codes.include?(error_code)
  end

  # Consent management
  def consent_expires_soon?
    consent_expires_at && consent_expires_at < 7.days.from_now
  end

  def consent_expired?
    consent_expires_at && consent_expires_at < Time.current
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        institution: { only: [:id, :name, :logo_url] },
        accounts: { only: [:id, :name, :account_type, :current_balance, :mask] }
      },
      methods: [
        :institution_name, :error_display_message, :consent_expires_soon?,
        :total_balance, :account_count, :sync_in_progress?
      ]
    ))
  end

  private

  def set_initial_status
    self.status ||= 'active'
  end

  def schedule_initial_sync
    return if manual_provider?
    
    # Schedule initial sync with a slight delay to allow transaction to complete
    # Gracefully handle Sidekiq being unavailable
    SyncAccountsJob.safe_perform_later(self, set_options: { wait: 30.seconds, queue: 'high' })
  end

  def handle_status_changes
    if saved_change_to_status?
      case status
      when 'active'
        schedule_sync if provider_access_token.present?
      when 'disconnected', 'expired'
        SyncAccountsJob.cancel_for_connection(id) rescue nil
      end
    end
  end

  def manual_provider?
    provider == 'manual'
  end
end
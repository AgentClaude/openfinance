# User model for OpenFinance authentication and account management
# Includes Devise for authentication and JWT token support

class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  
  # Devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  # Associations
  belongs_to :household, optional: true
  has_many :household_memberships, dependent: :destroy
  has_many :households_as_member, through: :household_memberships, source: :household
  has_many :account_connections, through: :household, dependent: :destroy
  has_many :transactions, through: :household, dependent: :destroy
  has_many :notification_rules, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :notification_preferences, dependent: :destroy
  has_many :sent_invitations, class_name: 'Invitation', foreign_key: :invited_by_id, dependent: :destroy
  has_many :shared_accounts_received, class_name: 'SharedAccount', foreign_key: :shared_with_user_id, dependent: :destroy
  has_many :shared_accounts_given, class_name: 'SharedAccount', foreign_key: :shared_by_user_id, dependent: :destroy
  has_many :referrals_given, class_name: 'Referral', foreign_key: :referrer_id, dependent: :destroy
  has_many :referrals_received, class_name: 'Referral', foreign_key: :referred_user_id, dependent: :destroy
  has_many :api_keys, dependent: :destroy
  has_many :share_tokens, dependent: :destroy
  has_many :webhook_subscriptions, dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :role, inclusion: { in: %w[owner member advisor] }
  validates :household, presence: true, unless: :new_record?

  # Enums
  enum :role, { owner: 'owner', member: 'member', advisor: 'advisor' }

  # Scopes
  scope :active, -> { where(created_at: 1.day.ago..Time.current) }
  scope :by_household, ->(household_id) { where(household_id: household_id) }

  # Callbacks
  before_validation :set_default_role, on: :create
  after_create :create_default_household, unless: :household_id?
  after_create :generate_referral_code!
  after_update :update_jwt_payload, if: :saved_change_to_jti?

  # Virtual attributes
  attr_accessor :skip_household_creation

  # Two-factor authentication
  def two_factor_enabled?
    two_factor_secret.present?
  end

  def enable_two_factor!
    self.two_factor_secret = ROTP::Base32.random
    self.two_factor_enabled = true
    save!
  end

  def disable_two_factor!
    self.two_factor_secret = nil
    self.two_factor_enabled = false
    save!
  end

  def verify_two_factor_token(token)
    return false unless two_factor_enabled?
    
    totp = ROTP::TOTP.new(two_factor_secret)
    totp.verify(token, drift_ahead: 30, drift_behind: 30)
  end

  def two_factor_qr_code
    return nil unless two_factor_secret
    
    issuer = "OpenFinance"
    totp = ROTP::TOTP.new(two_factor_secret, issuer: issuer)
    totp.provisioning_uri(email)
  end

  # Household management
  def can_access_household?(target_household)
    household_id == target_household.id || 
    household_memberships.exists?(household: target_household)
  end

  def household_role_for(target_household)
    if household_id == target_household.id
      role
    else
      membership = household_memberships.find_by(household: target_household)
      membership&.role
    end
  end

  def primary_household
    household
  end

  def all_accessible_households
    Household.joins("LEFT JOIN household_memberships ON households.id = household_memberships.household_id")
             .where("households.id = ? OR household_memberships.user_id = ?", household_id, id)
             .distinct
  end

  # JWT payload customization
  def jwt_payload
    {
      sub: id,
      email: email,
      name: name,
      household_id: household_id,
      role: role,
      two_factor_enabled: two_factor_enabled?,
      iat: Time.current.to_i,
      jti: jti
    }
  end

  # Avatar handling
  def avatar_url
    if avatar.attached?
      Rails.application.routes.url_helpers.rails_blob_url(avatar, only_path: true)
    else
      generate_avatar_url
    end
  end

  # Preferences management
  def update_preferences!(new_preferences)
    merged_preferences = (preferences || {}).merge(new_preferences)
    update!(preferences: merged_preferences)
  end

  def get_preference(key, default_value = nil)
    (preferences || {})[key.to_s] || default_value
  end

  # Account activity tracking
  def update_last_activity!
    touch(:last_sign_in_at) if persisted?
  end

  def recently_active?
    last_sign_in_at && last_sign_in_at > 30.days.ago
  end

  # Full name display
  def display_name
    name.present? ? name : email.split('@').first.titleize
  end

  # Admin check
  def admin?
    role == 'owner'
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :email, :name, :role, :created_at, :updated_at],
      methods: [:display_name, :avatar_url, :two_factor_enabled?]
    ))
  end

  private

  def set_default_role
    self.role ||= 'owner'
  end

  def create_default_household
    return if skip_household_creation || household_id.present?
    
    household_name = "#{display_name}'s Household"
    default_household = Household.create!(
      name: household_name
    )
    
    update!(household: default_household)
  end

  def update_jwt_payload
    # Trigger JWT token refresh on next request
    # This is called when jti changes (logout/security update)
  end

  def generate_referral_code!
    Referrals::GenerateReferralCode.new(self).call
  end

  def generate_avatar_url
    # Generate a default avatar URL using the user's initials or a service like Gravatar
    hash = Digest::MD5.hexdigest(email.downcase)
    "https://www.gravatar.com/avatar/#{hash}?d=identicon&s=150"
  end
end
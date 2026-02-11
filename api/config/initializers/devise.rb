# Devise configuration for OpenFinance
# Use this hook to configure devise mailer, warden hooks and so forth.
# Many of these configuration options can be set straight in your model.

Devise.setup do |config|
  # The secret key used by Devise. Devise uses this key to generate
  # random tokens. Changing this key will render invalid all existing
  # confirmation, reset password and unlock tokens in the database.
  config.secret_key = ENV.fetch('SECRET_KEY_BASE', 'dev-secret-key-change-me')

  # ==> Mailer Configuration
  # Configure the e-mail address which will be shown in Devise::Mailer,
  # note that it will be overwritten if you use your own mailer class
  # with default "from" parameter.
  config.mailer_sender = ENV.fetch('FROM_EMAIL', 'noreply@openfinance.local')

  # Configure the class responsible to send e-mails.
  config.mailer = 'Devise::Mailer'

  # Configure the parent class responsible to send e-mails.
  config.parent_mailer = 'ApplicationMailer'

  # ==> ORM configuration
  # Load and configure the ORM. Supports :active_record (default) and
  # :mongoid (bson_ext recommended) by default. Other ORMs may be
  # available as additional gems.
  require 'devise/orm/active_record'

  # ==> Configuration for any authentication mechanism
  # Configure which keys are used when authenticating a user.
  config.authentication_keys = [:email]

  # Configure parameters from the request object used for authentication.
  config.request_keys = []

  # If http headers should be used for authentication.
  config.http_authenticatable = false

  # It will change confirmation, password recovery and other workflows
  # to behave the same regardless if the e-mail provided was right or wrong.
  # Does not affect registrations.
  config.paranoid = true

  # By default Devise will store the user in session.
  config.skip_session_storage = [:http_auth, :token_auth]

  # By default, Devise cleans up the CSRF token on authentication to
  # avoid CSRF token fixation attacks.
  config.clean_up_csrf_token_on_authentication = false

  # When false, Devise will not attempt to reload routes on eager load.
  config.reload_routes = true

  # ==> Configuration for :database_authenticatable
  # For bcrypt, this is the cost for hashing the password.
  config.stretches = Rails.env.test? ? 1 : 12

  # Set up a pepper to generate the hashed password.
  config.pepper = Rails.application.credentials.devise_pepper || ENV['DEVISE_PEPPER']

  # Send a notification to the original email when the user's email is changed.
  config.send_email_changed_notification = true

  # Send a notification email when the user's password is changed.
  config.send_password_change_notification = true

  # ==> Configuration for :confirmable
  # A period that the user is allowed to access the website even without
  # confirming their account.
  config.allow_unconfirmed_access_for = 2.days

  # A period that the user is allowed to confirm their account before their
  # token becomes invalid.
  config.confirm_within = 3.days

  # If true, requires any email changes to be confirmed.
  config.reconfirmable = true

  # Defines which key will be used when confirming an account.
  config.confirmation_keys = [:email]

  # ==> Configuration for :rememberable
  # The time the user will be remembered without asking for credentials again.
  config.remember_for = 2.weeks

  # Invalidates all the remember me tokens when the user signs out.
  config.expire_all_remember_me_on_sign_out = true

  # If true, extends the user's remember period when remembered via cookie.
  config.extend_remember_period = false

  # Options to be passed to the created cookie.
  config.rememberable_options = {}

  # ==> Configuration for :validatable
  # Range for password length.
  config.password_length = 8..128

  # Email regex used to validate email formats.
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/

  # ==> Configuration for :timeoutable
  # The time you want to timeout the user session without activity.
  config.timeout_in = ENV.fetch('SESSION_TIMEOUT_HOURS', 72).to_i.hours

  # ==> Configuration for :lockable
  # Defines which strategy will be used to lock an account.
  config.lock_strategy = :failed_attempts

  # Defines which key will be used when locking and unlocking an account
  config.unlock_keys = [:email]

  # Defines which strategy will be used to unlock an account.
  config.unlock_strategy = :email

  # Number of authentication tries before locking an account.
  config.maximum_attempts = 5

  # Time interval to unlock the account if :time is enabled as unlock_strategy.
  config.unlock_in = 1.hour

  # Warn on the last attempt before the account is locked.
  config.last_attempt_warning = true

  # ==> Configuration for :recoverable
  # Defines which key will be used when recovering the password for an account
  config.reset_password_keys = [:email]

  # Time interval you can reset your password with a reset password key.
  config.reset_password_within = 6.hours

  # When set to false, does not sign a user in automatically after their password is reset.
  config.sign_in_after_reset_password = false

  # ==> Configuration for :encryptable
  # Allow you to use another hashing or encryption algorithm besides bcrypt (default).
  # You can use :sha1, :sha512 or algorithms from others authentication tools as
  # :clearance_sha1, :authlogic_sha512 (then you should set stretches above to 20
  # for default behavior) and :restful_authentication_sha1 (then you should set
  # stretches to 10, and copy REST_AUTH_SITE_KEY to pepper).
  # Require the `devise-encryptable` gem when using anything other than bcrypt
  # config.encryptor = :sha512

  # ==> Scopes configuration
  # Turn scoped views on.
  config.scoped_views = false

  # Configure the default scope given to Warden.
  config.default_scope = :user

  # Set this configuration to false if you want /users/sign_out to sign out
  # only the current scope.
  config.sign_out_all_scopes = true

  # ==> Navigation configuration
  # Lists the formats that should be treated as navigational.
  config.navigational_formats = []

  # The default HTTP method used to sign out a resource.
  config.sign_out_via = :delete

  # ==> OmniAuth
  # Add a new OmniAuth provider.
  # config.omniauth :github, 'APP_ID', 'APP_SECRET', scope: 'user,public_repo'

  # ==> Warden configuration
  # JWT configuration handled by devise-jwt gem
end
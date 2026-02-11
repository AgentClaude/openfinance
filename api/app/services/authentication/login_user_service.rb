# Service for user authentication
# Handles login, JWT token generation, and security checks

class Authentication::LoginUserService < ApplicationService
  attr_accessor :email, :password, :two_factor_token, :remember_me

  validates :email, presence: true
  validates :password, presence: true

  def call
    return validation_failure(self) unless valid?

    find_user!
    check_user_status!
    authenticate_password!
    verify_two_factor! if @user.two_factor_enabled?
    update_user_activity!
    generate_tokens!

    success(
      user: @user,
      access_token: @access_token,
      refresh_token: @refresh_token,
      expires_in: token_expiration
    )
  rescue AuthenticationError => e
    failure([e.message])
  rescue StandardError => e
    Rails.logger.error "Login failed: #{e.message}"
    failure(['Login failed. Please try again.'])
  end

  private

  def find_user!
    @user = User.find_by(email: email.downcase.strip)
    raise AuthenticationError, 'Invalid email or password' unless @user
  end

  def check_user_status!
    if @user.locked_at.present?
      raise AuthenticationError, 'Your account has been locked. Please contact support.'
    end

    unless @user.confirmed?
      raise AuthenticationError, 'Please confirm your email address before signing in.'
    end
  end

  def authenticate_password!
    unless @user.valid_password?(password)
      increment_failed_attempts!
      raise AuthenticationError, 'Invalid email or password'
    end

    reset_failed_attempts! if @user.failed_attempts > 0
  end

  def verify_two_factor!
    if two_factor_token.blank?
      raise AuthenticationError, 'Two-factor authentication code is required'
    end

    unless @user.verify_two_factor_token(two_factor_token)
      raise AuthenticationError, 'Invalid two-factor authentication code'
    end
  end

  def update_user_activity!
    @user.update_columns(
      last_sign_in_at: Time.current,
      last_sign_in_ip: request_ip,
      sign_in_count: @user.sign_in_count + 1
    )
  end

  def generate_tokens!
    @access_token = generate_access_token
    @refresh_token = generate_refresh_token if remember_me == true
  end

  def generate_access_token
    payload = @user.jwt_payload.merge(
      type: 'access',
      exp: token_expiration.to_i
    )
    
    JWT.encode(payload, Rails.application.config.jwt_secret_key, 'HS256')
  end

  def generate_refresh_token
    return unless remember_me
    
    payload = {
      sub: @user.id,
      type: 'refresh',
      exp: 30.days.from_now.to_i,
      jti: SecureRandom.uuid
    }
    
    JWT.encode(payload, Rails.application.config.jwt_secret_key, 'HS256')
  end

  def token_expiration
    ENV.fetch('JWT_EXPIRATION_HOURS', 24).to_i.hours.from_now
  end

  def increment_failed_attempts!
    @user.increment!(:failed_attempts)
    
    if @user.failed_attempts >= Devise.maximum_attempts
      @user.lock_access!
    end
  end

  def reset_failed_attempts!
    @user.update_columns(failed_attempts: 0)
  end

  def request_ip
    # This would normally come from the controller/request context
    # For now, we'll use a placeholder
    '127.0.0.1'
  end

  class AuthenticationError < StandardError; end
end
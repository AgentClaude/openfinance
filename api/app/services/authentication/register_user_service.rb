# Service for user registration
# Handles account creation, household setup, and email confirmation

class Authentication::RegisterUserService < ApplicationService
  attr_accessor :email, :password, :password_confirmation, :name, :household_name

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 8 }
  validates :name, presence: true, length: { minimum: 2 }
  validate :password_confirmation_matches

  def call
    return validation_failure(self) unless valid?

    ActiveRecord::Base.transaction do
      create_user!
      create_household!
      setup_default_data!
      send_confirmation_email!
    end

    success(user: @user, household: @household)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages)
  rescue StandardError => e
    Rails.logger.error "User registration failed: #{e.message}"
    failure(['Registration failed. Please try again.'])
  end

  private

  def create_user!
    @user = User.new(
      email: email.downcase.strip,
      password: password,
      password_confirmation: password_confirmation,
      name: name.strip,
      role: 'owner',
      skip_household_creation: true
    )

    @user.save!
  end

  def create_household!
    household_name_to_use = household_name.presence || "#{@user.name}'s Household"
    
    @household = Household.create!(name: household_name_to_use)
    @user.update!(household: @household)
  end

  def setup_default_data!
    # Create system categories
    Categories::CreateSystemCategoriesService.call(household: @household)
    
    # Create default budget
    Budgets::CreateDefaultBudgetService.call(household: @household)
  end

  def send_confirmation_email!
    @user.send_confirmation_instructions if @user.respond_to?(:send_confirmation_instructions)
  end

  def password_confirmation_matches
    return unless password.present? && password_confirmation.present?
    
    errors.add(:password_confirmation, "doesn't match password") if password != password_confirmation
  end
end
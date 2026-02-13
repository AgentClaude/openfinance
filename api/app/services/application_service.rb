# Base service class for OpenFinance
# All service objects inherit from this class and use the .call pattern

class ApplicationService
  include ActiveModel::Validations
  include ActiveModel::AttributeAssignment

  # Class method to create instance and call it
  def self.call(**args)
    new(**args).call
  end

  def initialize(**args)
    assign_attributes(args)
  end

  # Override in subclasses
  def call
    raise NotImplementedError, "#{self.class.name} must implement #call"
  end

  protected

  # Helper for successful results
  def success(data = {})
    ServiceResult.new(success: true, data: data)
  end

  # Helper for failed results
  def failure(errors = {}, data = {})
    ServiceResult.new(success: false, errors: errors, data: data)
  end

  # Helper for validation failures
  def validation_failure(object)
    failure(object.errors.full_messages)
  end

  # Helper to check if user can perform action
  def authorize!(user, action, resource = nil)
    unless can?(user, action, resource)
      raise AuthorizationError, "User #{user.id} cannot #{action} #{resource&.class&.name || 'resource'}"
    end
  end

  # Simple authorization helper (can be extended with Pundit later)
  def can?(user, action, resource = nil)
    case action
    when :manage_household
      user.owner? && (resource.nil? || user.household_id == resource.id)
    when :view_household_data
      resource.nil? || user.can_access_household?(resource)
    when :edit_transactions
      resource.nil? || (user.can_access_household?(resource.household) && !user.advisor?)
    else
      true
    end
  end
end

# Result object for service responses
class ServiceResult
  attr_reader :data, :errors
  alias_method :value, :data

  def initialize(success:, data: {}, errors: [])
    @success = success
    @data = data
    @errors = Array(errors)
  end

  def success?
    @success
  end

  def failure?
    !success?
  end

  def error_message
    errors.first
  end

  def error_messages
    errors.join(', ')
  end
end

# Custom error classes
class AuthorizationError < StandardError; end
class ServiceError < StandardError; end
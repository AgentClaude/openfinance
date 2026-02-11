class AuthorizationError < StandardError; end

class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  
  # Handle common exceptions
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_validation_errors
  rescue_from AuthorizationError, with: :render_authorization_error

  private

  def render_not_found(exception)
    render json: {
      error: "Record not found",
      message: exception.message
    }, status: :not_found
  end

  def render_validation_errors(exception)
    render json: {
      error: "Validation failed",
      message: exception.message,
      details: exception.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  def render_authorization_error(exception)
    render json: {
      error: "Access denied",
      message: exception.message
    }, status: :forbidden
  end

  def render_error(message, status = :bad_request)
    render json: {
      error: message
    }, status: status
  end

  def render_success(data = {}, status = :ok)
    render json: {
      success: true,
      data: data
    }, status: status
  end
end
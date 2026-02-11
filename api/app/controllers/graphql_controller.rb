class GraphqlController < ApplicationController
  # Disable CSRF for GraphQL API

  before_action :authenticate_user_from_token

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {
      current_user: current_user,
      request: request
    }

    result = OpenfinanceSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    
    render json: result
  rescue StandardError => e
    raise e unless Rails.env.production?
    
    render json: { errors: [{ message: "Internal server error" }] }, status: 500
  end

  private

  def current_user
    @current_user
  end

  def authenticate_user_from_token
    token = extract_token_from_request
    return unless token

    begin
      secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
      payload = JWT.decode(token, secret).first
      @current_user = User.find_by(id: payload['sub'])
    rescue JWT::DecodeError, JWT::ExpiredSignature
      # Token is invalid or expired
      @current_user = nil
    end
  end

  def extract_token_from_request
    auth_header = request.headers['Authorization']
    return unless auth_header&.start_with?('Bearer ')
    
    auth_header.split(' ').last
  end

  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end
end
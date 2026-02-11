module Api
  class SessionsController < ApplicationController
    def create
      user = User.find_by(email: params.dig(:user, :email))

      if user&.valid_password?(params.dig(:user, :password))
        token = generate_jwt(user)
        render json: {
          token: token,
          user: { id: user.id, email: user.email, name: user.name, role: user.role }
        }, status: :ok
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      render json: { message: "Logged out" }, status: :ok
    end

    def refresh
      render json: { error: "Not implemented" }, status: :not_implemented
    end

    private

    def generate_jwt(user)
      secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
      payload = {
        sub: user.id,
        jti: SecureRandom.uuid,
        exp: 24.hours.from_now.to_i,
        iat: Time.current.to_i
      }
      JWT.encode(payload, secret, 'HS256')
    end
  end
end

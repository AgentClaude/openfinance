module Mutations
  class LoginMutation < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    def resolve(email:, password:)
      user = User.find_by(email: email)

      if user&.valid_password?(password)
        secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
        token = JWT.encode(
          { sub: user.id, jti: SecureRandom.uuid, exp: 24.hours.from_now.to_i, iat: Time.current.to_i },
          secret, 'HS256'
        )
        { token: token, user: user, errors: [] }
      else
        { token: nil, user: nil, errors: ["Invalid email or password"] }
      end
    end
  end
end

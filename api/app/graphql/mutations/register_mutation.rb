module Mutations
  class RegisterMutation < BaseMutation
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true

    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    def resolve(name:, email:, password:)
      household = Household.create!(name: "#{name}'s Household")
      user = User.new(name: name, email: email, password: password, household: household, role: 'owner')

      if user.save
        Category.create_system_categories_for_household(household)
        secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
        token = JWT.encode(
          { sub: user.id, jti: SecureRandom.uuid, exp: 24.hours.from_now.to_i, iat: Time.current.to_i },
          secret, 'HS256'
        )
        { token: token, user: user, errors: [] }
      else
        household.destroy
        { token: nil, user: nil, errors: user.errors.full_messages }
      end
    end
  end
end

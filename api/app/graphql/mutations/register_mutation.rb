module Mutations
  class RegisterMutation < BaseMutation
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true
    argument :referral_code, String, required: false

    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    def resolve(name:, email:, password:, referral_code: nil)
      household = Household.create!(name: "#{name}'s Household")
      user = User.new(name: name, email: email, password: password, household: household, role: 'owner')

      if user.save
        # Categories are created via Household after_create callback (CreateDefaultCategoriesJob)
        # No need to call Category.create_system_categories_for_household here
        secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
        token = JWT.encode(
          { sub: user.id, jti: SecureRandom.uuid, exp: 24.hours.from_now.to_i, iat: Time.current.to_i },
          secret, 'HS256'
        )
        # Process referral if code provided
        if referral_code.present?
          referrer = User.find_by(referral_code: referral_code)
          if referrer && referrer.id != user.id
            Referral.create(
              referrer: referrer,
              referred_user: user,
              referral_code: referral_code,
              status: 'completed'
            )
          end
        end

        { token: token, user: user, errors: [] }
      else
        household.destroy
        { token: nil, user: nil, errors: user.errors.full_messages }
      end
    end
  end
end

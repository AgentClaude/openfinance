Devise.setup do |config|
  config.jwt do |jwt|
    jwt.secret = ENV.fetch('JWT_SECRET_KEY', 'dev-jwt-secret-change-me')
    jwt.expiration_time = ENV.fetch('JWT_EXPIRATION_HOURS', 24).to_i.hours.to_i

    jwt.dispatch_requests = [
      ['POST', %r{^/api/auth/login$}],
      ['POST', %r{^/api/auth/register$}]
    ]

    jwt.revocation_requests = [
      ['DELETE', %r{^/api/auth/logout$}]
    ]
  end
end

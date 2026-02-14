module AuthHelper
  def create_authenticated_user
    household = create(:household)
    create(:user, household: household, role: 'owner')
  end

  def auth_headers(user)
    auth_headers_for(user)
  end

  def auth_headers_for(user)
    token = generate_jwt_token(user)
    { 'Authorization' => "Bearer #{token}" }
  end

  def generate_jwt_token(user)
    secret = ENV.fetch('DEVISE_JWT_SECRET_KEY', Rails.application.secret_key_base)
    payload = { sub: user.id, jti: SecureRandom.uuid, exp: 24.hours.from_now.to_i, iat: Time.current.to_i }
    JWT.encode(payload, secret, 'HS256')
  end

  def graphql_query(query, variables: {}, user: nil)
    headers = user ? auth_headers_for(user) : {}
    headers['Content-Type'] = 'application/json'
    headers['Accept'] = 'application/json'
    
    post '/graphql', params: {
      query: query,
      variables: variables
    }, headers: headers, as: :json

    begin
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      raise "Failed to parse response (status #{response.status}): #{response.body[0..500]}"
    end
  end
end
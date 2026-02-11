module AuthHelper
  def create_authenticated_user
    household = create(:household)
    create(:user, household: household, role: 'owner')
  end

  def auth_headers_for(user)
    token = generate_jwt_token(user)
    { 'Authorization' => "Bearer #{token}" }
  end

  def generate_jwt_token(user)
    payload = user.jwt_payload
    JWT.encode(payload, Rails.application.credentials.devise_jwt_secret_key)
  end

  def graphql_query(query, variables: {}, user: nil)
    headers = user ? auth_headers_for(user) : {}
    
    post '/graphql', params: {
      query: query,
      variables: variables
    }, headers: headers

    JSON.parse(response.body)
  end
end
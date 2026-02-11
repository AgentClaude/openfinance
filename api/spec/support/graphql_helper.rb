module GraphQLHelper
  def execute_graphql(query, variables: {}, context: {})
    OpenfinanceSchema.execute(
      query,
      variables: variables,
      context: context
    )
  end

  def graphql_response_data(result)
    result['data']
  end

  def graphql_response_errors(result)
    result['errors']
  end

  def expect_graphql_success(result)
    expect(graphql_response_errors(result)).to be_nil
  end

  def expect_graphql_error(result, message = nil)
    errors = graphql_response_errors(result)
    expect(errors).not_to be_nil
    expect(errors).not_to be_empty
    
    if message
      expect(errors.first['message']).to include(message)
    end
  end

  # Common GraphQL queries for testing
  def user_query
    <<~GRAPHQL
      query {
        me {
          id
          email
          name
          role
          displayName
        }
      }
    GRAPHQL
  end

  def accounts_query
    <<~GRAPHQL
      query {
        accounts {
          id
          name
          accountType
          currentBalance
          isManual
        }
      }
    GRAPHQL
  end

  def transactions_query(filters = {})
    variables_string = filters.map { |k, v| "#{k}: #{v.inspect}" }.join(', ')
    filters_string = filters.any? ? "(filters: { #{variables_string} })" : ""
    
    <<~GRAPHQL
      query {
        transactions#{filters_string} {
          edges {
            node {
              id
              name
              amount
              date
              category {
                id
                name
              }
              account {
                id
                name
              }
            }
          }
        }
      }
    GRAPHQL
  end
end
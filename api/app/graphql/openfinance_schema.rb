class OpenfinanceSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  max_depth 15
  max_complexity 1000
end

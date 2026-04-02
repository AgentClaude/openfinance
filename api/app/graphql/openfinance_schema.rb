class OpenfinanceSchema < GraphQL::Schema
  query(Types::QueryType)
  mutation(Types::MutationType)

  max_depth 15
  max_complexity 1000
end

# GraphQL configuration for OpenFinance

Rails.application.config.graphql_max_depth = ENV.fetch('GRAPHQL_MAX_DEPTH', 15).to_i
Rails.application.config.graphql_max_complexity = ENV.fetch('GRAPHQL_MAX_COMPLEXITY', 300).to_i
Rails.application.config.graphql_timeout = ENV.fetch('GRAPHQL_TIMEOUT_SECONDS', 30).to_i
Rails.application.config.graphql_introspection_enabled = !Rails.env.production?

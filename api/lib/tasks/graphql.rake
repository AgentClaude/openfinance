namespace :graphql do
  desc "Dump the GraphQL schema to schema.graphql"
  task schema_dump: :environment do
    schema_definition = OpenfinanceSchema.to_definition
    schema_path = Rails.root.join("../schema.graphql")
    File.write(schema_path, schema_definition)
    puts "Schema dumped to #{schema_path}"
  end
end

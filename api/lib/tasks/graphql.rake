namespace :graphql do
  desc "Dump GraphQL schema to SDL file"
  task dump_schema: :environment do
    schema = OpenfinanceSchema.to_definition
    schema_path = Rails.root.join("schema.graphql")
    File.write(schema_path, schema)
    puts "Schema written to #{schema_path}"
  end
end

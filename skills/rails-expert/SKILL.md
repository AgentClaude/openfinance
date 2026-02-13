---
name: rails-expert
description: Expert Rails 8 development with service objects, GraphQL, RSpec, and production patterns. Use for Rails API design, service object architecture, GraphQL schema design, database migrations, RSpec testing, performance optimization, or code review of Rails code. Triggers on Rails, Ruby, ActiveRecord, GraphQL-Ruby, RSpec, service objects, or API development.
---

# Rails Expert

## Architecture Principles

### Service Objects (mandatory for all business logic)
```ruby
class Accounts::CreateService < ApplicationService
  attr_accessor :user, :params
  validates :user, :params, presence: true

  def call
    return validation_failure(self) unless valid?
    ActiveRecord::Base.transaction do
      account = user.household.accounts.create!(permitted_params)
      success(account: account)
    end
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages)
  end
end
```

### Thin Controllers
Controllers only: parse params, call service, render response. No business logic.

### Thin Models  
Models only: associations, validations, scopes, enums. No business logic methods.

### Concerns for Shared Behavior
Extract shared model behavior into concerns. Extract shared controller behavior into concerns.

## Patterns

### GraphQL (graphql-ruby)
- Types mirror API contracts, not DB schema
- Mutations call services, never touch DB directly
- Use `argument_class` on InputTypes, not ObjectTypes
- Resolve N+1 with `includes` in query resolver or Dataloader

### Testing (RSpec)
- Factories (FactoryBot) for all test data
- Model specs: validations, associations, scopes
- Service specs: success/failure paths, edge cases
- Request specs: full HTTP cycle for GraphQL mutations/queries
- No `let!` unless needed — prefer `let` for lazy eval

### Database
- Always use UUIDs for primary keys
- Add indexes for foreign keys and frequently queried columns
- Use `change` in migrations (not `up`/`down`) unless irreversible
- Amount fields: use `_cents` integer columns, never floats

### API Design
- JSON:API or GraphQL — pick one, be consistent
- Pagination: cursor-based for GraphQL, page-based for REST
- Auth: JWT in Authorization header, stateless

## Code Review Checklist
See references/rails-review-checklist.md

## Performance Patterns
See references/rails-performance.md

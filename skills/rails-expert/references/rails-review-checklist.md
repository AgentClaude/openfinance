# Rails Code Review Checklist

## Architecture
- [ ] Business logic in service objects, not models/controllers
- [ ] Controllers are thin (parse, delegate, render)
- [ ] No raw SQL without parameterization
- [ ] Proper use of transactions for multi-step operations
- [ ] Error handling returns meaningful messages

## Database
- [ ] Migrations are reversible
- [ ] Indexes on foreign keys and query columns
- [ ] No N+1 queries (use `includes`, `preload`, `eager_load`)
- [ ] Amount/money stored as integer cents
- [ ] UUIDs for primary keys
- [ ] No column type changes without migration strategy

## Security
- [ ] Strong params used (no `.permit!`)
- [ ] Authorization checked (user can access resource?)
- [ ] No mass assignment vulnerabilities
- [ ] Secrets in ENV, not committed
- [ ] CSRF protection (or explicitly API-only)
- [ ] Rate limiting on auth endpoints

## Testing
- [ ] Service specs cover success + failure paths
- [ ] Model specs cover validations + scopes
- [ ] Request specs for new endpoints
- [ ] Factories don't use hardcoded IDs
- [ ] No test pollution (database_cleaner/transactional)

## GraphQL
- [ ] Types match frontend expectations
- [ ] Mutations return the mutated object
- [ ] Error handling uses GraphQL::ExecutionError
- [ ] Arguments validated before DB operations
- [ ] No N+1 in resolvers

## Performance
- [ ] Pagination on list queries
- [ ] Eager loading for associated data
- [ ] Background jobs for slow operations
- [ ] Caching where appropriate (Russian doll, fragment, low-level)
- [ ] Database queries use indexes

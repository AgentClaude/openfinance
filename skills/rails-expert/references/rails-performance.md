# Rails Performance Patterns

## Database
- **Indexes**: Always index FKs, polymorphic type+id, frequently filtered/sorted columns
- **Counter caches**: Use for `has_many` counts displayed frequently
- **Select only needed columns**: `Account.select(:id, :name, :balance_cents)` 
- **Batch processing**: `find_each` / `in_batches` for large datasets
- **Avoid N+1**: `includes` for preloading, `bullet` gem for detection

## Caching
- **Fragment caching**: `cache @account do` in views/serializers
- **Russian doll**: Nested cache keys with `touch: true`
- **Low-level**: `Rails.cache.fetch("key", expires_in: 1.hour) { expensive_query }`
- **HTTP caching**: `stale?` / `fresh_when` for conditional GETs

## Background Jobs
- Move to Sidekiq: email, PDF generation, sync, reports, imports
- Use `perform_later` not `perform_now`
- Idempotent jobs (safe to retry)
- Set timeouts and retries

## Query Optimization
```ruby
# Bad: N+1
transactions.each { |t| t.account.name }

# Good: eager load
transactions.includes(:account).each { |t| t.account.name }

# Good: pluck for simple values
Transaction.where(household: h).pluck(:amount_cents).sum

# Good: database aggregation
Transaction.where(household: h).sum(:amount_cents)
```

## API Response
- Pagination (never return unbounded lists)
- Sparse fieldsets (only return requested fields)
- Compression (gzip/brotli)
- Connection pooling (tune pool size to worker count)

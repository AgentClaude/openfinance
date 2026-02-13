---
name: perf-audit
description: Full-stack performance auditing for Rails API and React frontend. Use when profiling slow queries, analyzing bundle size, auditing API response times, checking for N+1 queries, optimizing React rendering, or running Lighthouse/Web Vitals checks. Triggers on performance audit, slow query, N+1, bundle size, Lighthouse, load time, or optimization.
---

# Performance Audit

## Quick Audit Workflow
1. **API profiling** — identify slow endpoints and queries
2. **Database analysis** — missing indexes, N+1, slow queries
3. **Frontend bundle** — size analysis, code splitting opportunities
4. **Rendering** — unnecessary re-renders, virtualization needs
5. **Report** — write findings to `docs/perf-audit-<date>.md`

## API Profiling

### Rails request timing
```ruby
# In rails console or runner:
ActiveSupport::Notifications.subscribe("process_action.action_controller") do |*args|
  event = ActiveSupport::Notifications::Event.new(*args)
  puts "#{event.payload[:controller]}##{event.payload[:action]}: #{event.duration.round(1)}ms db=#{event.payload[:db_runtime]&.round(1)}ms"
end
```

### Find N+1 queries
Add `bullet` gem to Gemfile (test/development):
```ruby
gem 'bullet', group: [:development, :test]
```
Check logs for Bullet warnings after running test suite.

### Slow query log
```sql
-- In PostgreSQL:
ALTER SYSTEM SET log_min_duration_statement = 100; -- log queries > 100ms
SELECT pg_reload_conf();
```

## Database Analysis
```sql
-- Missing indexes on foreign keys
SELECT c.relname AS table, a.attname AS column
FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid
WHERE a.attname LIKE '%_id' AND c.relkind = 'r'
AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.oid
AND a.attnum = ANY(i.indkey));

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(oid))
FROM pg_class WHERE relkind = 'r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 20;

-- Unused indexes
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE '%pkey%';
```

## Frontend Analysis

### Bundle size
```bash
cd web && npx vite-bundle-visualizer
# Or: npx source-map-explorer dist/assets/*.js
```

### Lighthouse
```bash
npx lighthouse http://localhost:3002 --output=json --output-path=/tmp/lighthouse.json
```

### Key metrics
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 200ms

## Report Template
```markdown
# Performance Audit — <date>

## Summary
Overall health: 🟢/🟡/🔴

## API
| Endpoint | Avg Response | DB Time | Issues |
|----------|-------------|---------|--------|

## Database
- Missing indexes: 
- N+1 queries found: 
- Slow queries (>100ms): 

## Frontend
- Bundle size: 
- LCP: 
- FID: 
- CLS: 

## Recommendations
1. [Priority] Description — Expected improvement
```

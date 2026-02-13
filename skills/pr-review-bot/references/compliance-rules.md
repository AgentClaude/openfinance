# Compliance Rules for PR Review

## Security (BLOCKING — must fix before merge)
- No secrets, API keys, or passwords in code
- No `.env` files committed
- SQL injection: all queries parameterized
- XSS: user input sanitized/escaped in templates
- Auth: all endpoints check authorization
- CSRF: protection enabled or explicitly API-only
- No `eval()`, `send()` with user input, or `permit!`
- Dependencies: no known critical CVEs (`bundle audit`, `npm audit`)

## Data Safety (BLOCKING)
- Migrations must be reversible (or have documented rollback plan)
- No destructive migrations without data backup strategy
- No `DROP TABLE` or `remove_column` without confirmation
- Sensitive data encrypted at rest (PII, tokens, passwords)
- No logging of sensitive data (passwords, tokens, SSNs)

## Code Quality (REQUEST CHANGES if severe)
- No commented-out code blocks (>3 lines)
- No `console.log`, `binding.pry`, `debugger` statements
- No `TODO` or `FIXME` without linked issue
- Functions < 50 lines, files < 500 lines (guideline, not hard rule)
- DRY: no copy-pasted blocks > 10 lines

## Testing (REQUEST CHANGES if missing)
- New features have tests
- Bug fixes have regression tests
- Tests actually assert behavior (not just "doesn't crash")
- No flaky tests introduced (check retry counts)
- Test coverage doesn't decrease

## Performance (COMMENT if concerning)
- No N+1 queries (check includes/preload)
- No unbounded queries (must have limit/pagination)
- No synchronous heavy operations in request cycle
- Database indexes for new foreign keys and query patterns

## Documentation (COMMENT)
- Public APIs documented
- Complex logic has inline comments
- Breaking changes noted in PR description
- Migration instructions if needed

## Style (NON-BLOCKING — comment only)
- Follows project conventions
- Consistent naming
- Proper TypeScript types (no `any`)
- Tailwind classes organized (responsive, state, base)

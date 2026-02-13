---
name: pr-review-bot
description: Automated PR creation, review, and compliance checking using multi-agent workflows. Use when creating pull requests for review, reviewing PRs for code quality and compliance, running automated code review on branches, or orchestrating agent-to-agent PR review loops. Triggers on PR review, code review, pull request, compliance check, review bot, or multi-agent review.
---

# PR Review Bot — Multi-Agent Workflow

## Overview
Agents create feature branches, put up PRs, and a separate review agent reviews the code for quality, compliance, and correctness before merge.

## Workflow

### 1. Developer Agent (creates PR)
```bash
cd <repo>
git checkout -b feat/<feature-name>
# ... make changes ...
git add -A && git commit -m "feat: <description>"
git push -u origin feat/<feature-name>
gh pr create --title "feat: <description>" --body-file - <<'EOF'
## Changes
- What changed and why

## Testing
- How it was tested
- Test results (pass/fail counts)

## Checklist
- [ ] Tests added/updated
- [ ] No console.log / binding.pry left
- [ ] Migrations reversible
- [ ] Types updated (codegen)
EOF
```

### 2. Review Agent (reviews PR)
Spawn a review agent with:
```
Review PR #<number> in <repo>.
Read the skill at skills/pr-review-bot/SKILL.md first.
Follow the review checklist strictly.
Post review comments via `gh pr review`.
```

#### Review Process
1. **Fetch PR info**: `gh pr view <number> --json title,body,files,additions,deletions`
2. **Read the diff**: `gh pr diff <number>`
3. **Run checklists** from references/ based on file types:
   - `.rb` files → references/rails-review-checklist.md
   - `.tsx`/`.ts` files → references/react-review-checklist.md
   - Migration files → check reversibility, indexes, data safety
   - Test files → check coverage, edge cases
4. **Run tests**: `docker compose exec api bundle exec rspec` + `cd web && npx playwright test`
5. **Post review**:
   - Approve: `gh pr review <number> --approve --body "LGTM: <summary>"`
   - Request changes: `gh pr review <number> --request-changes --body "<issues>"`
   - Comment: `gh pr review <number> --comment --body "<feedback>"`

#### Review Standards
- **Blocking**: Security issues, data loss risk, broken tests, N+1 queries, no error handling
- **Non-blocking**: Style nits, naming suggestions, refactoring ideas
- **Auto-approve**: Documentation-only changes, dependency bumps with passing tests

### 3. Merge
After approval: `gh pr merge <number> --squash --delete-branch`

## Compliance Rules
See references/compliance-rules.md

## Multi-Agent Orchestration

### From main session, orchestrate like this:
```
# Developer agent builds feature
sessions_spawn(task="Build <feature> on a feature branch, put up a PR. Read skills/pr-review-bot/SKILL.md.", label="dev-<feature>")

# After dev finishes, review agent reviews
sessions_spawn(task="Review PR #<N> in AgentClaude/openfinance. Read skills/pr-review-bot/SKILL.md for review process.", label="review-<feature>")
```

### Cron-based PR review
Set up a cron job to check for open PRs and auto-review:
```
Check for open PRs: gh pr list --repo AgentClaude/openfinance --json number,title
For each unreviewed PR, spawn a review agent.
```

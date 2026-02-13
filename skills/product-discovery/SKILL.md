---
name: product-discovery
description: Product discovery, research, and planning for new features and products. Use when exploring problem spaces, conducting competitive analysis, defining user stories, creating PRDs, running design sprints, or planning product roadmaps. Triggers on product research, feature discovery, user research, competitive analysis, PRD creation, or roadmap planning.
---

# Product Discovery & Research

## Workflow

1. **Problem framing** — Define the problem space, target users, and success criteria
2. **Research** — Competitive analysis, user needs, market sizing
3. **Ideation** — Feature brainstorming, prioritization (RICE/ICE scoring)
4. **Specification** — PRD, user stories, acceptance criteria
5. **Planning** — Roadmap, milestones, dependencies

## Commands

### Discovery Brief
Create `docs/discovery/<feature-name>/BRIEF.md`:
```markdown
# Discovery: <Feature Name>
## Problem Statement
## Target Users
## Success Metrics
## Competitive Landscape
## Risks & Assumptions
## Open Questions
```

### Competitive Analysis
Create `docs/discovery/<feature-name>/COMPETITORS.md`:
- Search web for top 5-10 competitors
- Document: features, pricing, strengths, weaknesses, differentiation opportunities
- Include screenshots/links where relevant

### PRD (Product Requirements Document)
Create `docs/prd/<feature-name>.md` — see references/prd-template.md

### User Stories
Generate stories in format:
```
As a <persona>, I want to <action> so that <benefit>.
Acceptance Criteria:
- [ ] Given... When... Then...
```

### RICE Scoring
Score features: Reach × Impact × Confidence / Effort
Output as markdown table sorted by score.

### Roadmap
Create `docs/ROADMAP.md` with phases, milestones, dependencies, and timeline estimates.

## Research Tools
- `web_search` for market research, competitor analysis
- `web_fetch` for reading competitor docs, pricing pages
- Save all research artifacts to `docs/discovery/`

## References
- PRD template: references/prd-template.md
- User story patterns: references/user-stories.md

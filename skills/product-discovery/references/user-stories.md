# User Story Patterns

## Format
```
As a <persona>, I want to <action> so that <benefit>.

Acceptance Criteria:
- Given <context>, when <action>, then <outcome>
- Given <context>, when <action>, then <outcome>
```

## Priority Levels
- **P0**: Launch blocker, core functionality
- **P1**: Important, should ship in v1
- **P2**: Nice to have, can follow up
- **P3**: Future consideration

## RICE Scoring
- **Reach**: How many users affected per quarter (number)
- **Impact**: 3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal
- **Confidence**: 100%=high, 80%=medium, 50%=low
- **Effort**: Person-months

Score = (Reach × Impact × Confidence) / Effort

## Story Splitting Patterns
- Split by workflow step
- Split by business rule variation
- Split by data variation
- Split by interface (API vs UI)
- Split by operation (CRUD)
- Split by performance (basic → optimized)

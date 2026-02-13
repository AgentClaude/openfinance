---
name: react-expert
description: Expert React development with TypeScript, hooks, TailwindCSS, Apollo Client, and modern patterns. Use for React component design, state management, GraphQL integration, performance optimization, accessibility, or code review of React/TypeScript code. Triggers on React, TypeScript, hooks, Tailwind, Apollo, frontend, or component architecture.
---

# React Expert

## Architecture

### Component Patterns
- **Functional components only** (no class components)
- **Custom hooks** for all shared logic (`useAuth`, `useTransactions`, `useDebounce`)
- **Composition over prop drilling** — use context for cross-cutting concerns
- **Colocation** — keep styles, tests, types near components

### File Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level components
├── hooks/          # Custom hooks
├── graphql/        # Queries, mutations, fragments
├── lib/            # Utilities, Apollo client, helpers
├── types/          # Shared TypeScript interfaces
└── generated/      # GraphQL codegen output (don't edit)
```

### TypeScript
- **Strict mode** always
- **Interface over type** for objects (extendable)
- **No `any`** — use `unknown` and narrow
- **GraphQL Codegen** for API types — never hand-write query types

### State Management
- **Local state**: `useState` for component state
- **Server state**: Apollo Client cache (or React Query)
- **Global state**: React Context for auth, theme, preferences
- **URL state**: React Router for filters, pagination, tabs

### Apollo Client
- `fetchPolicy: 'network-only'` for data that changes often
- `cache.modify` for optimistic updates
- Never use broken merge policies on paginated queries
- Strip empty/null values from variables before sending

## Patterns

### Custom Hook Pattern
```typescript
export const useTransactions = (filters: Filters = {}) => {
  const cleaned = cleanFilters(filters); // strip empty values
  const { data, loading, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: cleaned,
  });
  return { transactions: data?.transactions ?? [], loading, refetch };
};
```

### Error Boundary
Wrap route-level components. Show fallback UI, report to logging.

### Loading States
Skeleton screens > spinners. Show layout shape while loading.

## Code Review Checklist
See references/react-review-checklist.md

## Performance
See references/react-performance.md

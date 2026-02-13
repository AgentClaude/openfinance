# React Performance Patterns

## Rendering
- **React.memo** for pure components that re-render with same props
- **useMemo** for expensive computations
- **useCallback** for callbacks passed to memoized children
- **Don't premature optimize** — profile first with React DevTools

## Lists
- **Virtualization**: `react-window` or `react-virtuoso` for 100+ items
- **Stable keys**: Use IDs, never array index
- **Pagination**: Load 20-50 items, fetchMore on scroll

## Code Splitting
```typescript
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
// Wrap with Suspense + fallback
```

## Images
- Lazy loading: `loading="lazy"` on img tags
- Responsive: srcset for different screen sizes
- WebP/AVIF formats when possible

## Apollo Client
- **Normalized cache** for deduplication
- **fetchPolicy**: `cache-and-network` for stale-while-revalidate
- **Optimistic updates** for instant UI feedback
- **Pagination**: `fetchMore` with proper `updateQuery`
- **Strip empty variables** to avoid API bugs

## Bundle Size
- Tree-shake: import `{ specific }` not `import *`
- Analyze: `npx vite-bundle-visualizer`
- Avoid: moment.js (use date-fns), lodash full (use lodash-es/specific)
- Dynamic imports for heavy libraries (charts, PDF, etc.)

## Measuring
- React DevTools Profiler
- Lighthouse CI
- Web Vitals (LCP, FID, CLS)
- `React.Profiler` component for programmatic measurement

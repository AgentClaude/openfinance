# React Code Review Checklist

## Components
- [ ] Functional components (no class components)
- [ ] Props have TypeScript interfaces (no `any`)
- [ ] Destructured props in function signature
- [ ] No inline function definitions in JSX (use useCallback or extract)
- [ ] Key props on list items (not array index)
- [ ] Conditional rendering handles loading/error/empty states

## Hooks
- [ ] Dependencies arrays are correct (no missing deps)
- [ ] No hooks inside conditionals or loops
- [ ] Custom hooks extract reusable logic
- [ ] useEffect cleanup for subscriptions/timers
- [ ] useMemo/useCallback only where needed (not premature)

## State
- [ ] State lives at the right level (not too high, not too low)
- [ ] No derived state (compute from existing state instead)
- [ ] Server state via Apollo/React Query (not useState)
- [ ] Forms use controlled components or react-hook-form

## TypeScript
- [ ] No `any` types
- [ ] Interfaces for component props
- [ ] GraphQL codegen types used (not hand-written)
- [ ] Enums or union types for finite sets

## Performance
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Large lists use virtualization (react-window)
- [ ] Images lazy loaded
- [ ] Code splitting for route-level components
- [ ] Bundle size checked (no giant imports)

## Accessibility
- [ ] Semantic HTML (button not div, nav not div)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Focus management on modals/dialogs

## Tailwind
- [ ] Responsive classes (sm:, md:, lg:)
- [ ] No arbitrary values when Tailwind utility exists
- [ ] Dark mode support if applicable
- [ ] Consistent spacing scale

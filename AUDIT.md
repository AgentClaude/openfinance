# OpenFinance Accessibility Audit Report

_Generated: 2026-04-03T23:27:23.149Z_
_Tool: axe-core via @axe-core/playwright_
_Standards: WCAG 2.0 A/AA, WCAG 2.1 A/AA_

## Summary

| Metric | Count |
|--------|-------|
| Pages scanned | 21 |
| Total rules passed | 452 |
| Total violations | 22 |
| Critical | 0 |
| Serious | 22 |
| Moderate | 0 |
| Minor | 0 |
| Unique violation types | 2 |

**Accessibility Score: 95%** (452 passes / 474 total checks)

## Page-by-Page Summary

| Page | Path | Violations | Passes | Score |
|------|------|------------|--------|-------|
| 🟠 Landing Page | `/` | 1 | 21 | 95% |
| 🟠 Login | `/login` | 1 | 21 | 95% |
| 🟠 Register | `/register` | 1 | 21 | 95% |
| 🟠 Docs | `/docs` | 1 | 14 | 93% |
| 🟠 Dashboard | `/dashboard` | 1 | 21 | 95% |
| ✅ Transactions | `/transactions` | 0 | 26 | 100% |
| 🟠 Accounts | `/accounts` | 1 | 20 | 95% |
| 🟠 Budget | `/budget` | 1 | 20 | 95% |
| 🟠 Categories | `/categories` | 1 | 21 | 95% |
| 🟠 Rules | `/rules` | 1 | 21 | 95% |
| 🟠 Merchant Mappings | `/merchant-mappings` | 1 | 20 | 95% |
| 🟠 Recurring | `/recurring` | 1 | 20 | 95% |
| 🟠 Reports | `/reports` | 2 | 26 | 93% |
| 🟠 Net Worth | `/net-worth` | 1 | 27 | 96% |
| 🟠 Investments | `/investments` | 2 | 25 | 93% |
| 🟠 Import | `/import` | 1 | 23 | 96% |
| 🟠 Goals | `/goals` | 1 | 21 | 95% |
| 🟠 Notifications | `/notifications` | 1 | 20 | 95% |
| 🟠 Activity | `/activity` | 1 | 20 | 95% |
| 🟠 Financial Health | `/health` | 1 | 21 | 95% |
| 🟠 Settings | `/settings` | 1 | 23 | 96% |

## Violations by Rule

### 🟠 color-contrast (serious)

**Elements must meet minimum color contrast ratio thresholds**

Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

- **Instances:** 4
- **Pages affected:** Landing Page, Login, Register, Docs, Dashboard, Accounts, Budget, Categories, Rules, Merchant Mappings, Recurring, Reports, Net Worth, Investments, Import, Goals, Notifications, Activity, Financial Health, Settings
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

### 🟠 svg-img-alt (serious)

**<svg> elements with an img role must have alternative text**

Ensure <svg> elements with an img, graphics-document or graphics-symbol role have accessible text

- **Instances:** 10
- **Pages affected:** Reports, Investments
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/svg-img-alt?application=playwright](https://dequeuniversity.com/rules/axe/4.11/svg-img-alt?application=playwright)

## Clean Pages (No Violations) ✅

- **Transactions** (`/transactions`) — 26 checks passed

## Recommendations

1. Fix all critical and serious violations first
2. Add `aria-label` to interactive elements missing accessible names
3. Ensure all form inputs have associated labels
4. Check color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large)
5. Ensure all images have alt text
6. Test keyboard navigation on all interactive components
7. Re-run this audit after fixes to verify improvements

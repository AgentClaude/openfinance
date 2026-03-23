# OpenFinance Accessibility Audit Report

_Generated: 2026-03-23T05:05:58.327Z_
_Tool: axe-core via @axe-core/playwright_
_Standards: WCAG 2.0 A/AA, WCAG 2.1 A/AA_

## Summary

| Metric | Count |
|--------|-------|
| Pages scanned | 21 |
| Total rules passed | 384 |
| Total violations | 57 |
| Critical | 30 |
| Serious | 27 |
| Moderate | 0 |
| Minor | 0 |
| Unique violation types | 7 |

**Accessibility Score: 87%** (384 passes / 441 total checks)

## Page-by-Page Summary

| Page | Path | Violations | Passes | Score |
|------|------|------------|--------|-------|
| 🔴 Landing Page | `/` | 3 | 20 | 87% |
| 🔴 Login | `/login` | 3 | 20 | 87% |
| 🔴 Register | `/register` | 3 | 20 | 87% |
| 🟠 Docs | `/docs` | 1 | 14 | 93% |
| 🔴 Dashboard | `/dashboard` | 3 | 20 | 87% |
| 🔴 Transactions | `/transactions` | 2 | 23 | 92% |
| 🔴 Accounts | `/accounts` | 2 | 16 | 89% |
| 🔴 Budget | `/budget` | 3 | 17 | 85% |
| 🔴 Categories | `/categories` | 3 | 17 | 85% |
| 🔴 Rules | `/rules` | 3 | 17 | 85% |
| 🔴 Merchant Mappings | `/merchant-mappings` | 3 | 15 | 83% |
| 🔴 Recurring | `/recurring` | 2 | 16 | 89% |
| 🔴 Reports | `/reports` | 4 | 24 | 86% |
| 🔴 Net Worth | `/net-worth` | 3 | 21 | 88% |
| 🔴 Investments | `/investments` | 4 | 23 | 85% |
| 🔴 Import | `/import` | 3 | 17 | 85% |
| 🔴 Goals | `/goals` | 3 | 17 | 85% |
| 🔴 Notifications | `/notifications` | 2 | 15 | 88% |
| 🔴 Activity | `/activity` | 2 | 16 | 89% |
| 🔴 Financial Health | `/health` | 3 | 16 | 84% |
| 🔴 Settings | `/settings` | 2 | 20 | 91% |

## Violations by Rule

### 🟠 color-contrast (serious)

**Elements must meet minimum color contrast ratio thresholds**

Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

- **Instances:** 2
- **Pages affected:** Landing Page, Login, Register, Docs, Dashboard, Accounts, Budget, Categories, Rules, Merchant Mappings, Recurring, Reports, Net Worth, Investments, Import, Goals, Notifications, Activity, Financial Health, Settings
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

### 🟠 svg-img-alt (serious)

**<svg> elements with an img role must have alternative text**

Ensure <svg> elements with an img, graphics-document or graphics-symbol role have accessible text

- **Instances:** 16
- **Pages affected:** Landing Page, Login, Register, Dashboard, Reports, Investments
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/svg-img-alt?application=playwright](https://dequeuniversity.com/rules/axe/4.11/svg-img-alt?application=playwright)

### 🟠 scrollable-region-focusable (serious)

**Scrollable region must have keyboard access**

Ensure elements that have scrollable content are accessible by keyboard

- **Instances:** 1
- **Pages affected:** Financial Health
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/scrollable-region-focusable?application=playwright](https://dequeuniversity.com/rules/axe/4.11/scrollable-region-focusable?application=playwright)

### 🔴 aria-allowed-attr (critical)

**Elements must only use supported ARIA attributes**

Ensure an element's role supports its ARIA attributes

- **Instances:** 1
- **Pages affected:** Landing Page, Login, Register, Dashboard, Transactions, Accounts, Budget, Categories, Rules, Merchant Mappings, Recurring, Reports, Net Worth, Investments, Import, Goals, Notifications, Activity, Financial Health, Settings
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/aria-allowed-attr?application=playwright](https://dequeuniversity.com/rules/axe/4.11/aria-allowed-attr?application=playwright)

### 🔴 label (critical)

**Form elements must have labels**

Ensure every form element has a label

- **Instances:** 51
- **Pages affected:** Transactions
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/label?application=playwright](https://dequeuniversity.com/rules/axe/4.11/label?application=playwright)

### 🔴 button-name (critical)

**Buttons must have discernible text**

Ensure buttons have discernible text

- **Instances:** 2
- **Pages affected:** Budget, Categories, Rules, Merchant Mappings, Goals
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright)

### 🔴 select-name (critical)

**Select element must have an accessible name**

Ensure select element has an accessible name

- **Instances:** 1
- **Pages affected:** Reports, Net Worth, Investments, Import
- **Reference:** [https://dequeuniversity.com/rules/axe/4.11/select-name?application=playwright](https://dequeuniversity.com/rules/axe/4.11/select-name?application=playwright)

## Recommendations

1. Fix all critical and serious violations first
2. Add `aria-label` to interactive elements missing accessible names
3. Ensure all form inputs have associated labels
4. Check color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large)
5. Ensure all images have alt text
6. Test keyboard navigation on all interactive components
7. Re-run this audit after fixes to verify improvements

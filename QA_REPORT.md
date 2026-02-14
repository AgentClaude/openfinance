# OpenFinance QA Audit Report

**Date:** February 14, 2026  
**URL:** http://100.98.139.2:3002  
**Tester:** Automated QA (Claude)  
**Account:** demo@openfinance.dev

---

## Executive Summary

**Pages Audited:** 15  
**Total Issues Found:** 14  
**Critical:** 1 | **Major:** 5 | **Minor:** 5 | **Cosmetic:** 3

Overall the app is functional and well-designed. The main concerns are chart rendering failures, data inconsistencies between pages, and some missing features advertised on the landing page.

---

## Issues by Severity

### 🔴 Critical

| # | Page | Issue | Details |
|---|------|-------|---------|
| 1 | Dashboard `/dashboard` | **Spending by Category chart not rendering** | The entire "Spending by Category" section is blank — no pie/donut chart appears despite transaction data existing. The Reports page shows the same data correctly in its own Spending by Category section. Likely a chart library rendering issue on the dashboard. |

### 🟠 Major

| # | Page | Issue | Details |
|---|------|-------|---------|
| 2 | Dashboard `/dashboard` | **Net Worth discrepancy with Accounts page** | Dashboard shows Net Worth as **$161,353.93** while Accounts page shows **-$143,119.93**. The Accounts page calculation appears correct (includes mortgage liability). The Dashboard appears to be summing only assets without subtracting liabilities. |
| 3 | Reports `/reports` | **Income vs Expenses bar chart is empty** | The "Income vs Expenses" chart shows axes and gridlines but **no bars are rendered**. Summary cards above show $54,263 income and $29,652 expenses, so data exists. Chart rendering is broken. |
| 4 | Budget `/budget` | **All category progress percentages show "0%"** | Every budget category row displays "0%" text next to the progress bar, even though the visual bars show correct fill levels (e.g., Utilities is clearly over 100%). The percentage text is hardcoded or not calculated. |
| 5 | Categories `/categories` | **All categories show "0 transactions this month"** | Every category card displays "0 transactions this month" despite the Transactions page showing 240 transactions with categories assigned. The count query is broken or not implemented. |
| 6 | Import `/import` | **OFX import not supported despite landing page claim** | Landing page advertises "CSV & OFX import" but the Import page only supports CSV files ("Click to upload CSV", "Supports Mint, bank exports, generic CSV"). No OFX option available. |

### 🟡 Minor

| # | Page | Issue | Details |
|---|------|-------|---------|
| 7 | Budget `/budget` | **Currency formatting: "$-5019.00" instead of "-$5,019.00"** | "Left to Budget" card shows `$-5019.00` — the negative sign is after the dollar sign and commas are missing. Should be `-$5,019.00`. |
| 8 | Settings `/settings` | **Last settings tabs truncated/hidden** | The "🔒 Security" and "📦 Data" tabs are cut off at the right edge. Only "🔒 S..." is visible. No horizontal scroll indicator or overflow handling for the tab bar. |
| 9 | Settings > Members | **No "Invite Member" button** | The Members tab shows existing household members but provides no way to invite new members. The landing page advertises "Multi-user collaboration" and "Role-based access" but there's no invitation flow. |
| 10 | Login `/login` | **"Forgot your password?" links to "#"** | The forgot password link has `href="#"` — it doesn't navigate anywhere. The feature appears unimplemented. |
| 11 | Settings > Preferences | **No save button** | Preferences tab has dropdowns for date format, currency, number format, etc., but no "Save" button is visible. It's unclear whether changes auto-save or are lost. |

### 🔵 Cosmetic

| # | Page | Issue | Details |
|---|------|-------|---------|
| 12 | Landing Page `/` | **Placeholder images throughout** | All feature preview images are gray placeholder boxes with text like "Dashboard Screenshot", "Budgets Preview", etc. No actual screenshots are displayed. |
| 13 | Investments `/investments` | **Asset allocation legend lacks labels** | The pie chart legend shows only color dots and percentages (56.9%, 20.4%, etc.) without security/category names. Users can't tell which color represents which holding. |
| 14 | Investments `/investments` | **Weight column values appear inaccurate** | AAPL ($5,718.75) shows 33.3% weight while VOO ($77,977.50) shows 61.9%. The weights appear to be per-account rather than portfolio-wide, which is confusing since "All Accounts" is selected. |

---

## Pages Audited (Status Summary)

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Landing Page | `/` | ⚠️ Cosmetic issues | Placeholder images |
| Login | `/login` | ⚠️ Minor issue | Forgot password broken |
| Registration | `/register` | ✅ OK | Redirects to dashboard when logged in (expected) |
| Dashboard | `/dashboard` | ❌ Critical + Major | Chart missing, net worth wrong |
| Transactions | `/transactions` | ✅ OK | Filters, search, edit panel, bulk select all work |
| Accounts | `/accounts` | ✅ OK | All account types display correctly |
| Goals | `/goals` | ✅ OK | Progress bars, status badges, edit/delete work |
| Budget | `/budget` | ⚠️ Major + Minor | 0% labels, currency formatting |
| Recurring | `/recurring` | ✅ OK | All items display, action buttons present |
| Categories | `/categories` | ❌ Major | Transaction counts all zero |
| Investments | `/investments` | ⚠️ Cosmetic | Legend labels missing, weight confusion |
| Reports | `/reports` | ❌ Major | Bar chart empty |
| Import | `/import` | ⚠️ Minor | No OFX support |
| Rules | `/rules` | ✅ OK | Toggle, edit, delete, add all present |
| Settings (all tabs) | `/settings` | ⚠️ Minor | Tabs overflow, no invite button, no save on preferences |
| Notifications | Bell icon | ✅ OK | Dropdown works |

---

## Console Warnings

Three recurring Apollo Client warnings on every page navigation (not errors):

1. **ApolloClient `connectToDevTools` deprecated** — should use `devtools.enabled` instead (Apollo 3.14.0)
2. **`useQuery` `onCompleted` deprecated** — should use derived state from `data`
3. **`useQuery` `onError` deprecated** — should use derived state from `error`/`errors`

Additionally on Settings page:
4. **Missing `autocomplete` attributes** on password input fields (suggested: `current-password`, `new-password`)

**No actual errors (red) were found in the console across all pages.**

---

## Recommendations (Priority Order)

1. **Fix dashboard Spending by Category chart** — critical visibility gap
2. **Fix Net Worth calculation on dashboard** — must include liabilities
3. **Fix Reports Income vs Expenses chart rendering** — major feature broken
4. **Fix Budget percentage labels** — showing 0% everywhere
5. **Fix Categories transaction count** — query returning 0 for all
6. **Add OFX import or remove from landing page** — false advertising
7. **Implement Forgot Password flow** — currently dead link
8. **Add horizontal scroll/overflow for Settings tabs** — last 2 tabs hidden
9. **Fix currency formatting** — negative sign placement
10. **Add actual screenshots to landing page** — replace placeholders

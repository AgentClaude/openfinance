# OpenFinance — Brand & Design Guidelines

> **Version:** 1.0 · **Date:** February 2026
> **Stack:** Rails 8 API + React + TailwindCSS

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Component Patterns](#5-component-patterns)
6. [Iconography](#6-iconography)
7. [Motion & Animation](#7-motion--animation)
8. [Tone of Voice](#8-tone-of-voice)
9. [Competitive Comparison](#9-competitive-comparison)
10. [Tailwind Config](#10-tailwind-config)

---

## 1. Brand Identity

### Mission Statement

**OpenFinance exists to make world-class personal finance tools free and accessible to everyone.**

Your financial data belongs to you. Not to an ad network, not to a subscription service, not locked behind a paywall. OpenFinance is the open-source personal finance platform that gives you complete visibility into your money — forever free, fully private, community-driven.

### Value Proposition

> "Monarch Money costs $99.99/year. OpenFinance costs $0/forever. Same power, your server, your data."

**Three pillars:**
- **Free Forever** — No subscriptions, no "premium" tier, no bait-and-switch
- **Open Source** — Audit the code, self-host it, contribute to it
- **Privacy-First** — Your data stays on your infrastructure, period

### Brand Personality

OpenFinance is **the competent friend who's great with money and never condescending about it.**

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Tone | Calm, confident, clear | Salesy, hype-driven, anxious |
| Knowledge | Expert but approachable | Jargon-heavy or dumbed-down |
| Attitude | Empowering, optimistic | Preachy, guilt-inducing |
| Design | Clean, modern, premium | Sterile, corporate, cheap |
| Values | Transparent, community-first | Closed, extractive |

We sound like **a well-designed tool**, not a lifestyle brand. YNAB is the motivational coach ("Get good at money!"). Monarch is the premium lifestyle product. Copilot is the design-forward Apple fan. **OpenFinance is the reliable, beautifully-built utility that respects your intelligence and your wallet.**

### Name Treatment & Logo Concepts

**Name:** "OpenFinance" — one word, capital O and F. Never "Open Finance" (two words) or "openfinance" (all lowercase) in marketing. In code/URLs, `openfinance` is acceptable.

**Logo Concept:**
- A geometric mark combining an **open book / open bracket** motif with a subtle upward-trending line (growth)
- The "O" in OpenFinance could be stylized as an **incomplete circle** (openness) with a small upward arrow integrated
- Clean, geometric, works at 16×16 favicon size
- **No** generic piggy banks, dollar signs, or shield icons
- Think: Linear's logo meets Stripe's restraint

**Logo Variations:**
- Full wordmark (logo + "OpenFinance")
- Icon mark only (for favicons, app icons)
- Monochrome versions (white on dark, dark on light)

---

## 2. Color System

### Design Philosophy

Finance apps must balance **trust** (blues, deep tones), **growth** (greens), and **clarity** (generous white space). We avoid the saturated "fintech purple" trend (overused by neobanks) and instead lean into **deep teal-blues with warm green accents** — a palette that feels trustworthy, modern, and distinct from every competitor.

### Primary Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Primary** | Deep Teal | `#0F766E` | Primary buttons, links, active states, brand anchor |
| **Primary Light** | Teal 400 | `#2DD4BF` | Hover states, highlights, progress bars |
| **Primary Dark** | Teal 900 | `#134E4A` | Headings on light bg, strong emphasis |

**Why teal?** It bridges trust (blue) and growth (green) — the two core emotions in finance. It's distinct from Monarch (purple/coral), YNAB (blue), Copilot (blue-black), and Lunch Money (yellow). Teal says "modern, capable, fresh."

### Secondary / Accent Colors

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Accent** | Warm Amber | `#F59E0B` | CTAs needing attention, badges, highlights |
| **Accent Soft** | Amber 100 | `#FEF3C7` | Accent backgrounds, tags |
| **Neutral** | Slate 700 | `#334155` | Body text (light mode) |
| **Neutral Light** | Slate 200 | `#E2E8F0` | Borders, dividers |
| **Neutral Muted** | Slate 400 | `#94A3B8` | Placeholder text, secondary text |

### Semantic Colors

| State | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **Success** | `#059669` (Emerald 600) | `#34D399` (Emerald 400) | Positive balances, goals met, income |
| **Warning** | `#D97706` (Amber 600) | `#FBBF24` (Amber 400) | Over budget warnings, pending items |
| **Error** | `#DC2626` (Red 600) | `#F87171` (Red 400) | Negative balances, errors, overspending |
| **Info** | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | Tips, informational banners |

### Money Colors (Finance-Specific)

| Concept | Color | Hex |
|---------|-------|-----|
| **Income / Positive** | Green | `#059669` |
| **Expense / Negative** | Red | `#DC2626` |
| **Transfer / Neutral** | Slate | `#64748B` |
| **Investment Gain** | Emerald | `#10B981` |
| **Investment Loss** | Rose | `#E11D48` |

### Light Mode Surface Colors

| Surface | Hex | Usage |
|---------|-----|-------|
| Background | `#FFFFFF` | Page background |
| Surface | `#F8FAFC` (Slate 50) | Cards, sidebars |
| Surface Raised | `#FFFFFF` | Modals, dropdowns (with shadow) |
| Border | `#E2E8F0` (Slate 200) | Card borders, dividers |
| Border Subtle | `#F1F5F9` (Slate 100) | Table row borders |

### Dark Mode Palette

| Surface | Hex | Usage |
|---------|-----|-------|
| Background | `#0F172A` (Slate 900) | Page background |
| Surface | `#1E293B` (Slate 800) | Cards, sidebars |
| Surface Raised | `#334155` (Slate 700) | Modals, dropdowns |
| Border | `#334155` (Slate 700) | Card borders |
| Border Subtle | `#1E293B` (Slate 800) | Table rows |
| Text Primary | `#F1F5F9` (Slate 100) | Body text |
| Text Secondary | `#94A3B8` (Slate 400) | Secondary text |
| Primary | `#2DD4BF` (Teal 400) | Buttons, links (brightened for dark bg) |

### Accessibility — Contrast Ratios

All text must meet **WCAG AA** minimum. Aim for **AAA** where possible.

| Combination | Ratio | Grade |
|-------------|-------|-------|
| Slate 700 on White | 8.6:1 | ✅ AAA |
| Teal 800 (`#115E59`) on White | 7.2:1 | ✅ AAA |
| Primary Teal on White | 4.6:1 | ✅ AA (large text) |
| Slate 100 on Slate 900 | 13.4:1 | ✅ AAA |
| Teal 400 on Slate 900 | 8.2:1 | ✅ AAA |
| Red 600 on White | 4.5:1 | ✅ AA |
| Emerald 600 on White | 4.6:1 | ✅ AA |

**Rules:**
- Body text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): minimum 3:1
- UI components & graphical objects: minimum 3:1
- Never rely on color alone to convey meaning (use icons + text)

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | Why |
|------|------|----------|-----|
| **Headings** | **Inter** | `system-ui, -apple-system, sans-serif` | Clean geometric sans-serif. Used by Linear, Vercel, Raycast. Free on Google Fonts. Excellent number rendering for finance. |
| **Body** | **Inter** | Same | One font, many weights — keeps bundle small |
| **Monospace** (numbers, code) | **JetBrains Mono** | `ui-monospace, 'SF Mono', monospace` | For account numbers, transaction amounts when tabular alignment matters |

**Why Inter?** It's the fintech industry standard for good reason: excellent legibility at small sizes, tabular number support (`font-variant-numeric: tabular-nums`), open source, and has variable font support for optimal performance. Monarch uses their own custom font, YNAB uses a rounded sans, Copilot uses SF Pro. Inter is the neutral-professional choice that ages well.

**Alternative consideration:** If you want slightly more personality, **DM Sans** (headings) + **Inter** (body) is a strong pairing. DM Sans has a friendlier geometric quality.

### Type Scale (1.250 — Major Third)

Use `rem` units. Base: `1rem = 16px`.

| Name | Size | rem | Weight | Line Height | Usage |
|------|------|-----|--------|-------------|-------|
| `text-xs` | 12px | 0.75 | 400–500 | 1.5 | Captions, timestamps |
| `text-sm` | 14px | 0.875 | 400–500 | 1.5 | Secondary text, table cells |
| `text-base` | 16px | 1 | 400 | 1.6 | Body text |
| `text-lg` | 18px | 1.125 | 500 | 1.5 | Emphasized body, card titles |
| `text-xl` | 20px | 1.25 | 600 | 1.4 | Section headers |
| `text-2xl` | 24px | 1.5 | 600 | 1.35 | Page section titles |
| `text-3xl` | 30px | 1.875 | 700 | 1.3 | Page titles |
| `text-4xl` | 36px | 2.25 | 700 | 1.2 | Hero numbers, dashboard totals |
| `text-5xl` | 48px | 3 | 700 | 1.1 | Marketing headlines |

### Number Display

Finance apps live and die by number readability:

```css
.financial-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  font-weight: 600;
}

.currency-large {
  font-size: 2.25rem; /* text-4xl */
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

- Always use **tabular-nums** for financial data (numbers align in columns)
- Negative numbers: use red color + minus sign (never parentheses for consumer apps)
- Large dashboard numbers: slightly tighter letter-spacing (-0.02em)

### Letter Spacing

| Context | Value |
|---------|-------|
| Headings (text-2xl+) | `-0.02em` |
| Body text | `0` (default) |
| All-caps labels | `0.05em` |
| Small text | `0.01em` |

---

## 4. Spacing & Layout

### Spacing Scale (4px Base)

```
0:    0px
0.5:  2px
1:    4px
1.5:  6px
2:    8px
2.5:  10px
3:    12px
4:    16px
5:    20px
6:    24px
8:    32px
10:   40px
12:   48px
16:   64px
20:   80px
24:   96px
```

This is Tailwind's default scale. Use it consistently.

### Layout Patterns

**App Shell:**
```
┌──────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content            │
│                   │                          │
│  Navigation       │  Page Header             │
│  - Dashboard      │  ─────────────────────   │
│  - Transactions   │                          │
│  - Budgets        │  Content Area            │
│  - Investments    │  (max-width: 1280px)     │
│  - Goals          │  (padding: 24px)         │
│  - Reports        │                          │
│  - Recurring      │                          │
│                   │                          │
│  ─────────────    │                          │
│  Settings         │                          │
│  Collaboration    │                          │
└──────────────────────────────────────────────┘
```

- **Sidebar:** Fixed, 240px wide, collapsible to 64px (icon-only) on tablet
- **Main content:** Fluid, `max-w-7xl` (1280px) with `px-6` padding
- **Mobile:** Sidebar becomes bottom tab bar or hamburger menu

### Card Patterns

| Variant | Padding | Border | Shadow | Border Radius |
|---------|---------|--------|--------|---------------|
| Default | `p-6` (24px) | `1px solid slate-200` | `none` | `rounded-xl` (12px) |
| Compact | `p-4` (16px) | `1px solid slate-200` | `none` | `rounded-lg` (8px) |
| Elevated | `p-6` | `none` | `shadow-md` | `rounded-xl` |
| Interactive | `p-6` | `1px solid slate-200` | `shadow-sm` → `shadow-md` on hover | `rounded-xl` |

**Dark mode cards:** Use `bg-slate-800` with `border-slate-700`. No shadows in dark mode (they don't read well) — use borders instead.

### Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `sm` | 640px | Single column, bottom nav |
| `md` | 768px | Collapsed sidebar (64px) |
| `lg` | 1024px | Full sidebar (240px) |
| `xl` | 1280px | Max content width reached |
| `2xl` | 1536px | Extra breathing room |

### Grid System

- Use CSS Grid for page layouts, Flexbox for component internals
- Dashboard: 12-column grid, cards spanning 4/6/12 columns
- Transaction list: Single column, full width
- Settings: 2-column (nav + content) at `lg+`, stacked below

---

## 5. Component Patterns

### Buttons

| Variant | Background | Text | Border | Hover | Active |
|---------|-----------|------|--------|-------|--------|
| **Primary** | `teal-600` | `white` | none | `teal-700` | `teal-800` |
| **Secondary** | `white` | `slate-700` | `1px slate-300` | `slate-50` bg | `slate-100` bg |
| **Ghost** | `transparent` | `slate-600` | none | `slate-100` bg | `slate-200` bg |
| **Danger** | `red-600` | `white` | none | `red-700` | `red-800` |
| **Danger Ghost** | `transparent` | `red-600` | none | `red-50` bg | `red-100` bg |

**Button sizes:**

| Size | Height | Padding | Font Size | Radius |
|------|--------|---------|-----------|--------|
| `sm` | 32px | `px-3` | 13px | `rounded-lg` |
| `md` | 40px | `px-4` | 14px | `rounded-lg` |
| `lg` | 48px | `px-6` | 16px | `rounded-xl` |

**Rules:**
- One primary button per view/section
- Loading state: spinner replaces text, button stays same width
- Disabled: 50% opacity, `cursor-not-allowed`
- Icon + text buttons: icon on the left, 8px gap

### Form Inputs

```
Height:     40px (md), 36px (sm), 48px (lg)
Padding:    px-3 (12px horizontal)
Border:     1px solid slate-300
Radius:     rounded-lg (8px)
Focus:      ring-2 ring-teal-500 ring-offset-2
Error:      border-red-500, ring-red-500
Font size:  14px (sm), 16px (md — prevents iOS zoom)
```

- Labels above inputs, not floating (accessibility & clarity)
- Error messages below input in red, prefixed with icon
- Required fields: don't use asterisks — mark optional fields instead ("Email (optional)")
- Currency inputs: `$` prefix inside the input, right-aligned numbers

### Selects & Toggles

- **Select:** Native `<select>` styled consistently, or custom dropdown for complex cases (category picker with icons)
- **Toggle:** 44×24px, teal when active, slate-300 when inactive. Always pair with a text label.
- **Checkbox:** 18×18px, rounded-sm, teal check

### Cards

```jsx
// Standard finance card
<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
    Card Title
  </h3>
  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
    Description
  </p>
  <div className="mt-4">
    {/* Content */}
  </div>
</div>
```

### Modals

- Max width: `max-w-lg` (512px) for forms, `max-w-2xl` (672px) for complex content
- Backdrop: `bg-black/50` with `backdrop-blur-sm`
- Padding: `p-6`, header separated by border-bottom
- Close button: top-right, ghost style, X icon
- Mobile: full-screen sheet sliding up from bottom

### Toasts / Notifications

- Position: top-right, stacked
- Width: 360px max
- Auto-dismiss: 5s for success, persistent for errors
- Include close button
- Semantic color left border (4px)
- Icon + message + optional action link

### Charts & Data Visualization Palette

Ordered by usage priority:

| Index | Color | Hex | Usage Example |
|-------|-------|-----|---------------|
| 1 | Teal | `#0D9488` | Primary category, spending total |
| 2 | Amber | `#F59E0B` | Secondary metric |
| 3 | Violet | `#7C3AED` | Third category |
| 4 | Rose | `#E11D48` | Fourth / negative emphasis |
| 5 | Sky | `#0EA5E9` | Fifth category |
| 6 | Emerald | `#10B981` | Sixth / positive emphasis |
| 7 | Orange | `#F97316` | Seventh |
| 8 | Indigo | `#6366F1` | Eighth |

**Chart rules:**
- Maximum 8 colors per chart; group remaining as "Other" in slate-400
- Bar charts: `rounded-t-md` (4px top radius)
- Line charts: 2px stroke, dots at data points on hover only
- Area charts: 10% opacity fill below the line
- Donut charts preferred over pie charts
- Always include a legend; preferably inline or below the chart
- Tooltips on hover with exact values
- Animate in on first render (500ms ease-out)
- Y-axis labels: abbreviated (`$1.2K`, `$45K`, `$1.2M`)

### Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│         [Illustration / Icon]           │
│                                         │
│      No transactions yet                │
│                                         │
│   Connect a bank account to start       │
│   seeing your transactions here.        │
│                                         │
│        [Connect Account]                │
│                                         │
└─────────────────────────────────────────┘
```

- Centered in the content area
- Muted illustration or large icon (48px, `text-slate-300`)
- Heading: `text-lg font-semibold text-slate-900`
- Description: `text-sm text-slate-500`, max 2 lines
- CTA button if there's an actionable next step

### Loading States

- **Skeleton screens** for initial page loads (not spinners)
- Skeletons: `bg-slate-200 dark:bg-slate-700 animate-pulse rounded`
- Match the shape of the content being loaded
- **Inline spinners** for button actions and small updates
- Spinner: 20px, 2px stroke, teal, `animate-spin`
- **Progress bars** for multi-step processes

### Error States

- Inline errors preferred over error pages
- Red left border + light red background (`bg-red-50`)
- Retry button where applicable
- Never show raw error codes to users
- 404: Custom page with helpful navigation back

### Navigation

**Sidebar navigation:**
- Icons (20px) + text labels
- Active item: `bg-teal-50 text-teal-700` (light) / `bg-teal-900/30 text-teal-400` (dark)
- Hover: `bg-slate-100` (light) / `bg-slate-800` (dark)
- Section dividers for grouping (main nav vs settings)
- Badge counts for notifications (red dot or number)

**Top bar:**
- Search (⌘K command palette style)
- Notification bell
- User avatar + dropdown

---

## 6. Iconography

### Style

- **Outlined** icons, 1.5px stroke weight
- 24×24px default size, 20px for navigation, 16px inline
- Rounded line caps and joins
- Consistent 24px viewBox

### Recommended Library

**[Lucide Icons](https://lucide.dev)** (fork of Feather Icons)
- Open source, MIT license (aligns with our values)
- 1000+ icons, actively maintained
- React components available (`lucide-react`)
- Consistent style, 24px grid, 1.5px stroke
- Tree-shakeable

### Finance-Specific Icons

| Concept | Lucide Icon | Notes |
|---------|------------|-------|
| Dashboard | `layout-dashboard` | |
| Transactions | `arrow-left-right` | |
| Budgets | `pie-chart` | |
| Investments | `trending-up` | |
| Goals | `target` | |
| Reports | `bar-chart-3` | |
| Recurring | `repeat` | |
| Accounts | `wallet` or `building-2` (bank) | |
| Credit Card | `credit-card` | |
| Settings | `settings` | |
| Collaboration | `users` | |
| Notifications | `bell` | |
| Income | `arrow-down-left` (green) | |
| Expense | `arrow-up-right` (red) | |
| Transfer | `arrow-right-left` (gray) | |
| Categories | `tag` | |
| Search | `search` | |
| Add | `plus` | |
| Net Worth | `scale` | |

### Category Icons

For budget/spending categories, use **emoji** rather than custom icons. This is the approach Copilot uses successfully — it's instantly recognizable, requires no design work, and users can customize:

🏠 Housing · 🛒 Groceries · 🍽️ Dining · 🚗 Transport · 💊 Health · 🎬 Entertainment · 👔 Shopping · ✈️ Travel · 📱 Subscriptions · 🎓 Education · 🐕 Pets · 🎁 Gifts

---

## 7. Motion & Animation

### Principles

1. **Purposeful** — Animation should communicate state changes, not decorate
2. **Fast** — Users are checking finances, not watching a show
3. **Consistent** — Same type of action = same animation

### Transitions

| Type | Duration | Easing | CSS |
|------|----------|--------|-----|
| Micro (hover, focus) | 150ms | `ease-out` | `transition-all duration-150 ease-out` |
| Small (toggles, dropdowns) | 200ms | `ease-out` | `transition-all duration-200 ease-out` |
| Medium (modals, panels) | 300ms | `ease-in-out` | `transition-all duration-300 ease-in-out` |
| Large (page transitions) | 400ms | `ease-in-out` | Via React Transition Group or Framer Motion |

### Micro-Interactions

- **Button hover:** Slight background color shift (150ms)
- **Button click:** Scale to 0.98 (100ms), back to 1.0 (150ms)
- **Toggle:** Thumb slides with spring easing
- **Checkbox:** Check mark draws in (200ms)
- **Number change:** Count up/down animation for dashboard totals (400ms)
- **Progress bar:** Width animates to new value (500ms ease-out)
- **Toast enter:** Slide in from right + fade (300ms)
- **Toast exit:** Fade out (200ms)

### Loading Animations

- Skeleton pulse: `animate-pulse` (2s infinite)
- Spinner: `animate-spin` (1s linear infinite)
- Progress: Determinate bar with percentage where possible
- **No** bouncing dots, no complex Lottie animations for loading

### Chart Animations

- Initial render: Bars grow from bottom, lines draw left-to-right (500ms, staggered 50ms per element)
- Data update: Morph/interpolate to new values (400ms)
- Hover: Data point scales up 1.5x (150ms)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Always respect `prefers-reduced-motion`. This is non-negotiable for accessibility.

---

## 8. Tone of Voice

### Personality in Writing

We are **helpful, clear, and respectful of people's intelligence.** We never talk down, never use anxiety as motivation, and never make users feel bad about their financial situation.

| ✅ Do | ❌ Don't |
|--------|----------|
| "You spent $340 on dining this month" | "You OVERSPENT on dining! 😱" |
| "Connect an account to get started" | "You haven't connected any accounts yet!" |
| "Budget updated" | "Great job updating your budget! 🎉🎉🎉" |
| "Something went wrong" | "Oops! An error occurred!" |

### Error Messages

**Format:** What happened → What to do about it

```
❌ Bad:  "Error 500: Internal Server Error"
❌ Bad:  "Oopsie! Something broke! 🙈"
✅ Good: "We couldn't save your budget. Check your connection and try again."
✅ Good: "This account couldn't sync. Your bank may be experiencing issues — we'll retry automatically."
```

**Rules:**
- Never blame the user
- Never show error codes (log them, don't display them)
- Always suggest a next action
- Use "we" for system failures, not "you"

### Empty States

Warm but functional. Always tell users *why* this is empty and *what to do next*.

```
Transactions — "No transactions yet. Connect a bank account or add one manually."
Budgets     — "No budgets set up. Create your first budget to start tracking spending by category."
Goals       — "No goals yet. Set a savings goal to track your progress toward what matters."
Reports     — "Not enough data for reports. Come back after a month of tracking."
```

### Celebration Moments

Subtle and genuine. No confetti explosions (unless the user explicitly enables them).

```
Goal reached:    "You reached your goal! $5,000 saved for Emergency Fund. 🎯"
Budget on track: "On track — you're 60% through the month with 55% of your budget spent."
Net worth up:    "Your net worth increased $2,400 this month."
Milestone:       "You've tracked 1,000 transactions. That's serious commitment."
```

**Rules:**
- One emoji max per celebration message
- State the fact, let the user feel the emotion
- Never compare users to each other

### Naming Conventions

- **Accounts**, not "wallets" or "sources"
- **Transactions**, not "entries" or "records"
- **Budgets**, not "envelopes" or "plans" (even though envelope budgeting inspired it)
- **Goals**, not "targets" or "objectives"
- **Categories**, not "tags" or "labels"
- **Recurring**, not "subscriptions" (recurring is broader)

---

## 9. Competitive Comparison

| Aspect | Monarch | YNAB | Copilot | Lunch Money | Actual Budget | **OpenFinance** |
|--------|---------|------|---------|-------------|---------------|-----------------|
| **Price** | $99.99/yr | $99/yr | $95.88/yr | $40/yr | Free (self-host) | **Free forever** |
| **Primary Color** | Purple/Coral | Blue (#85C3F2) | Black/Blue | Yellow (#FFD700) | Purple-Blue | **Teal (#0F766E)** |
| **Aesthetic** | Premium lifestyle | Friendly/motivational | Apple-design-award | Indie/playful | Developer/minimal | **Clean utility** |
| **Tone** | Aspirational | Coaching/evangelical | Design-forward | Casual/quirky | Technical/honest | **Calm/empowering** |
| **Fonts** | Custom serif+sans | Rounded sans (Cera) | SF Pro / system | System fonts | System fonts | **Inter** |
| **Target** | Couples & families | Debt-payers, savers | Apple ecosystem | Solo techies | Self-hosters | **Everyone** |
| **Open Source** | No | No | No | No | ✅ Yes | **✅ Yes** |
| **Self-Host** | No | No | No | No | ✅ Yes | **✅ Yes** |
| **Key Differentiator** | Holistic wealth view | Zero-based budgeting | Beautiful iOS UX | API-first, dev-friendly | Privacy, local-first | **Free + full-featured** |
| **Dark Mode** | Yes | No (!) | Yes (default) | Yes | Yes | **Yes** |
| **Weakness** | Expensive | No dark mode, dated UI | Apple-only (+ web) | Limited features | Requires self-hosting | *New, unproven* |

### Our Positioning

```
          Premium                          
              │                            
    Monarch ◆ │                            
              │          ◆ Copilot         
              │                            
  Closed ─────┼───────────────── Open      
              │                            
      YNAB ◆  │                            
              │      ◆ Lunch Money         
              │              ◆ Actual      
              │         ◆ OpenFinance      
          Accessible                       
```

**We sit in the open + accessible quadrant** — but with the polish of the premium quadrant. That's the gap. Actual Budget is open-source but looks like a developer tool. Monarch is polished but costs $100/yr. **OpenFinance is both.**

---

## 10. Tailwind Config

Practical configuration to implement these guidelines:

```js
// tailwind.config.js
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Surfaces (light)
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        // Surfaces (dark) — use via dark: variant
        'surface-dark': {
          DEFAULT: '#0F172A',
          secondary: '#1E293B',
          tertiary: '#334155',
        },
        // Semantic
        income: '#059669',
        expense: '#DC2626',
        transfer: '#64748B',
        // Chart palette
        chart: {
          1: '#0D9488',
          2: '#F59E0B',
          3: '#7C3AED',
          4: '#E11D48',
          5: '#0EA5E9',
          6: '#10B981',
          7: '#F97316',
          8: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Override with our line-heights
        'xs':   ['0.75rem',  { lineHeight: '1.5' }],
        'sm':   ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem',     { lineHeight: '1.6' }],
        'lg':   ['1.125rem', { lineHeight: '1.5' }],
        'xl':   ['1.25rem',  { lineHeight: '1.4' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.35' }],
        '3xl':  ['1.875rem', { lineHeight: '1.3' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.2' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],
      },
      letterSpacing: {
        'heading': '-0.02em',
        'tight': '-0.01em',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'number': 'countUp 400ms ease-out',
        'slide-in': 'slideIn 300ms ease-in-out',
        'fade-in': 'fadeIn 200ms ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### CSS Utilities

```css
/* globals.css */
@layer utilities {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
  
  .financial-number {
    @apply tabular-nums font-semibold tracking-tight;
  }
  
  .currency-positive {
    @apply text-income;
  }
  
  .currency-negative {
    @apply text-expense;
  }
  
  .currency-neutral {
    @apply text-transfer;
  }
}

@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

---

## Quick Reference Card

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary color | Teal `#0F766E` | Trust + growth, distinct from competitors |
| Font | Inter | Industry standard, great numbers, free |
| Icons | Lucide | Open source, consistent, tree-shakeable |
| Category icons | Emoji | Zero design cost, user-customizable |
| Spacing base | 4px (Tailwind default) | Industry standard |
| Border radius | 12px cards, 8px inputs | Modern but not bubbly |
| Dark mode | Slate 900/800 surfaces | True dark, not gray |
| Charts | 8-color sequential palette | Accessible, distinguishable |
| Animations | 150-400ms, respect reduced-motion | Fast, purposeful |
| Tone | Calm, clear, empowering | Not preachy, not anxious |

---

*These guidelines are a living document. Update as the product evolves. When in doubt: clarity over cleverness, utility over decoration, accessibility over aesthetics.*

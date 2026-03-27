---
phase: 08-ui-implementation
plan: 05
subsystem: ui
tags: [recharts, bento-grid, kpi-cards, stacked-bar, line-chart, grouped-bar, variant-comparison, motion, tanstack-query]

requires:
  - phase: 08-ui-implementation/08-01
    provides: App shell with sidebar, auth pages, project list
  - phase: 08-ui-implementation/08-02
    provides: GlassCard, KPICard, motion template, SaveStatusProvider
  - phase: 08-ui-implementation/08-03
    provides: Info and WLC form pages
  - phase: 08-ui-implementation/08-04
    provides: Construction and energy form pages
  - phase: 07-trpc-api-authentication
    provides: calculation.calculate tRPC query, project.getById query
provides:
  - Results dashboard with bento-grid layout, 4 KPI cards, 2 breakdown tables, 2 chart types
  - LCC stacked bar chart (design/construction/O&M/site management segments)
  - Cost evolution line chart (cumulative energy, maintenance, total O&M over reference period)
  - Variant grouped bar chart (side-by-side bars per cost component across variants)
  - Variant comparison side-by-side view with parallel useQueries
  - Construction breakdown table with 21 cost categories
  - WLC/LCC breakdown table with highlighted totals
affects: [09-export]

tech-stack:
  added: []
  patterns: [Recharts v3 Tooltip formatter with Number(value ?? 0) cast, useQueries for parallel variant calculation, bento CSS grid with staggered motion.div entrance, vertical BarChart layout for stacked LCC]

key-files:
  created:
    - src/app/(app)/projects/[id]/results/page.tsx
    - src/components/results/results-dashboard.tsx
    - src/components/results/breakdown-table.tsx
    - src/components/results/variant-comparison.tsx
    - src/components/results/charts/lcc-stacked-bar.tsx
    - src/components/results/charts/cost-evolution-line.tsx
    - src/components/results/charts/variant-grouped-bar.tsx
  modified: []

key-decisions:
  - "Recharts v3 Tooltip formatter requires Number(value ?? 0) cast since ValueType includes undefined"
  - "Vertical BarChart layout for LCC stacked bar (horizontal bars) for better readability of single-bar charts"
  - "useQueries (not individual useQuery) for parallel variant calculation in comparison view"
  - "Dashboard/Compare toggle buttons instead of tabs for cleaner results page UX"

patterns-established:
  - "Recharts formatter pattern: (value) => eurFormatter.format(Number(value ?? 0)) to satisfy Recharts v3 stricter types"
  - "Bento grid pattern: CSS grid with motion.div stagger (custom index, 0.08s delay, opacity+y)"
  - "Variant comparison pattern: useQueries + successfulVariants filter for graceful partial failure"

requirements-completed: [UI-14, UI-15, UI-16, UI-17, UI-18, UI-19, UI-20]

duration: 6min
completed: 2026-03-27
---

# Phase 8 Plan 05: Results Dashboard & Charts Summary

**Bento-grid results dashboard with 4 KPI cards, WLC/construction breakdown tables, 3 Recharts chart types (stacked bar, line, grouped bar), and variant comparison side-by-side view with parallel calculation queries**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T17:43:53Z
- **Completed:** 2026-03-27T18:48:46Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Results dashboard with auto-calculation on navigation, loading skeleton, error retry, and bento-grid layout
- 4 KPI cards (LCC, WLC, LCC/m2, payback period) with EUR formatting and staggered entrance animation
- Construction breakdown table showing all 21 cost categories with EUR formatting and total footer
- WLC/LCC breakdown table with highlighted LCC and WLC rows showing all cost components
- KPI ratio summary card showing design/construction/labor/O&M ratios as percentages
- LCC stacked bar chart with 4 color-coded segments (design, construction, O&M, site management)
- Cost evolution line chart showing cumulative energy, maintenance, and total O&M over reference period
- Variant grouped bar chart showing side-by-side comparison bars for each cost component
- Variant comparison view with N-column grid, per-variant KPIs, mini stacked bars, key metrics, and full-width grouped bar
- All charts respect prefers-reduced-motion and use hover-only tooltips

## Task Commits

Each task was committed atomically:

1. **Task 1: KPI cards, breakdown tables, and results dashboard layout** - `27f0d7e` (feat)
2. **Task 2: Three chart components (stacked bar, line, grouped bar)** - `b573c46` (feat)
3. **Task 3: Variant comparison side-by-side view** - `af8851b` (feat)

## Files Created/Modified
- `src/app/(app)/projects/[id]/results/page.tsx` - Results page with dashboard/compare view toggle
- `src/components/results/results-dashboard.tsx` - Bento-grid dashboard with KPIs, charts, tables
- `src/components/results/breakdown-table.tsx` - Construction and WLC/LCC breakdown tables
- `src/components/results/variant-comparison.tsx` - Side-by-side variant comparison with parallel queries
- `src/components/results/charts/lcc-stacked-bar.tsx` - Stacked bar chart for LCC breakdown
- `src/components/results/charts/cost-evolution-line.tsx` - Line chart for cumulative costs over time
- `src/components/results/charts/variant-grouped-bar.tsx` - Grouped bar chart for variant comparison

## Decisions Made
- Recharts v3 Tooltip `formatter` prop types are stricter than v2 -- requires `Number(value ?? 0)` cast since `ValueType` includes `undefined`
- Used vertical (horizontal bars) BarChart layout for LCC stacked bar since a single-bar chart reads better horizontally
- Used `useQueries` from @tanstack/react-query for parallel variant calculation fetches in comparison view
- Dashboard/Compare toggle buttons (not tabs) for results page view switching -- simpler UX without tab panel semantics

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Recharts v3 Tooltip formatter type mismatch**
- **Found during:** Task 2 (TypeScript build)
- **Issue:** Recharts v3 Tooltip `formatter` expects `(value: ValueType | undefined)` not `(value: number)` -- stricter generic types
- **Fix:** Changed formatter to `(value) => eurFormatter.format(Number(value ?? 0))` in all 3 chart components
- **Files modified:** lcc-stacked-bar.tsx, cost-evolution-line.tsx, variant-grouped-bar.tsx
- **Verification:** Build passes
- **Committed in:** b573c46 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug -- Recharts v3 type strictness)
**Impact on plan:** Auto-fix necessary for TypeScript compilation correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 wizard steps complete (Info, WLC, Construction, Energy, Results)
- Phase 08 UI Implementation fully complete
- Ready for Phase 09 (Export) which will add PDF/Excel export from results

## Self-Check: PASSED

All 7 created files verified present. All 3 task commits verified in git log (27f0d7e, b573c46, af8851b).

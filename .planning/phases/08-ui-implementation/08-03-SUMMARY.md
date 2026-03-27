---
phase: 08-ui-implementation
plan: 03
subsystem: ui
tags: [react-hook-form, zod, autosave, tRPC, glass-morphism, wizard-steps, variant-tabs, react-number-format]

requires:
  - phase: 08-ui-implementation/08-01
    provides: App shell with sidebar, auth pages, project list
  - phase: 08-ui-implementation/08-02
    provides: GlassCard, WizardSteps, VariantTabs, SaveStatusBadge, useAutosave, CurrencyInput, PercentInput, SliderInput
  - phase: 07-trpc-api-authentication
    provides: tRPC project/variant routers, reference.energySources query
provides:
  - Project layout with wizard navigation, variant tabs, save status badge
  - Info form page with metadata + geometry + income sections autosaving
  - WLC form page with boundary conditions + energy prices + non-construction + design costs autosaving
  - Autosave pattern established for all form steps with separate hooks per section
affects: [08-04, 08-05, 09-export]

tech-stack:
  added: []
  patterns: [multi-section autosave with separate useAutosave per form section, URL-param variant switching with key remount, Record<string unknown> for flexible tRPC variant types]

key-files:
  created:
    - src/app/(app)/projects/[id]/layout.tsx
    - src/app/(app)/projects/[id]/info/page.tsx
    - src/components/forms/info-form.tsx
    - src/app/(app)/projects/[id]/wlc/page.tsx
    - src/components/forms/wlc-form.tsx
  modified: []

key-decisions:
  - "URL search param ?v=VARIANT_ID for active variant (enables direct linking, simpler than React context)"
  - "key={activeVariantId} on children wrapper forces full remount on variant switch preventing stale form data"
  - "Record<string, unknown> for variant section props to handle Prisma Int?/Decimal? serialized as unknown"
  - "Separate useAutosave hooks per form section (metadata, geometry, income, boundary, WLC, design) all feeding same SaveStatusProvider"

patterns-established:
  - "Form page pattern: thin page.tsx reads variant ID from URL params, renders form component"
  - "Multi-section form: each GlassCard section has its own useForm + useAutosave hook with separate tRPC mutation"
  - "Design costs editable table: useFieldArray with add/remove rows, replace-pattern save to variant.upsertDesignCosts"
  - "Energy prices table: merge reference.energySources with existing data for defaults, inline NumericFormat in table cells"

requirements-completed: [UI-08, UI-09, UI-13]

duration: 9min
completed: 2026-03-27
---

# Phase 8 Plan 03: Project Layout + Info & WLC Forms Summary

**Project layout with wizard/variant navigation and two autosaving form pages: Info (metadata, geometry, income) and WLC (boundary conditions, energy prices, non-construction costs, design costs table)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-27T12:36:39Z
- **Completed:** 2026-03-27T12:46:10Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Project layout composing WizardSteps, VariantTabs, SaveStatusBadge with URL-param variant switching and key-based remount
- Info form with 3 autosaving sections: project metadata (8 fields), geometry (19 fields in 3 cards), income input (16 fields with rent/other income tables)
- WLC form with 4 autosaving sections: boundary conditions (slider + percent inputs), energy prices table (18 rows from reference data), non-construction costs (12 fields), design costs editable table with add/delete rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Project layout with wizard steps, variant tabs, save status** - `b5e2c1d` (feat)
2. **Task 2: Info form page (project metadata, geometry, income input)** - `0a74b87` (feat)
3. **Task 3: WLC form page (non-construction costs, boundary conditions, energy prices, design costs)** - `f7833ef` (feat)

## Files Created/Modified
- `src/app/(app)/projects/[id]/layout.tsx` - Project layout with SaveStatusProvider, WizardSteps, VariantTabs, Suspense children
- `src/app/(app)/projects/[id]/info/page.tsx` - Thin page wrapper reading variant ID from URL params
- `src/components/forms/info-form.tsx` - Info form with MetadataSection, GeometrySection, IncomeSection components
- `src/app/(app)/projects/[id]/wlc/page.tsx` - Thin page wrapper reading variant ID from URL params
- `src/components/forms/wlc-form.tsx` - WLC form with BoundaryCondition, EnergyPrices, NonConstruction, DesignCosts sections

## Decisions Made
- Used URL search param `?v=VARIANT_ID` for variant switching instead of React context -- enables direct linking and is simpler to implement
- Applied `key={activeVariantId}` on children wrapper to force full remount on variant switch, preventing stale form data
- Used `Record<string, unknown>` for variant section prop types to handle Prisma fields serialized as `unknown` (referencePeriod from Int?, Decimal fields)
- Separate useAutosave hooks per form section rather than a single form -- each section has independent save lifecycle feeding the same SaveStatusProvider

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch for Prisma serialized fields**
- **Found during:** Task 3 (WLC form build)
- **Issue:** `serializeBoundaryCondition` passes `referencePeriod` as-is from Prisma (typed `unknown`), causing type errors when used as `number` in component props
- **Fix:** Changed component variant prop types to `Record<string, unknown>` with explicit casts at usage points
- **Files modified:** src/components/forms/wlc-form.tsx
- **Verification:** Build passes without TypeScript errors
- **Committed in:** f7833ef (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-safety adjustment for Prisma serialization quirk. No scope creep.

## Issues Encountered
None beyond the type mismatch handled above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project layout and form pattern fully established for remaining form pages
- 08-04 (Construction + Energy forms) can follow identical pattern: thin page + multi-section form component
- 08-05 (Results page) has all prerequisite data entry pages ready

## Self-Check: PASSED

All 5 created files verified present. All 3 task commits verified in git log.

---
*Phase: 08-ui-implementation*
*Completed: 2026-03-27*

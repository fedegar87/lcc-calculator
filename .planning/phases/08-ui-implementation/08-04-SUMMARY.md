---
phase: 08-ui-implementation
plan: 04
subsystem: ui
tags: [accordion, combobox, cmdk, base-ui, autosave, react-number-format, construction-costs, energy-inputs]

requires:
  - phase: 08-ui-implementation/08-01
    provides: App shell with sidebar, auth pages, project list
  - phase: 08-ui-implementation/08-02
    provides: GlassCard, InfoTooltip, SliderInput, useAutosave, CurrencyInput, SaveStatusProvider
  - phase: 07-trpc-api-authentication
    provides: costItem router (listByVariant, upsert, upsertDetail, deleteDetail), variant router (upsertEnergyInputs, upsertMaintenanceConfig, upsertServiceComponent, deleteServiceComponent), reference router (en15459Components, costCategories, energySources)
provides:
  - Construction step with 21 cost category accordions in 5 groups, detail row CRUD, service component CRUD with EN 15459 combobox
  - Energy step with dual-system consumption table, PV production field, maintenance config slider
  - EN 15459 searchable combobox with 80+ HVAC components and type-ahead filtering
affects: [08-05, 09-export]

tech-stack:
  added: []
  patterns: [debounced detail mutation (per-detail 500ms debounce with pending updates ref), discrete service component CRUD (direct mutations not autosave), base-ui Accordion multiple prop, base-ui Select onValueChange string|null handling]

key-files:
  created:
    - src/app/(app)/projects/[id]/construction/page.tsx
    - src/components/forms/construction-form.tsx
    - src/components/forms/shared/en15459-combobox.tsx
    - src/app/(app)/projects/[id]/energy/page.tsx
    - src/components/forms/energy-form.tsx
  modified: []

key-decisions:
  - "Construction detail updates use per-detail debounce with pendingUpdates ref (not useAutosave) since fields are imperative not RHF-managed"
  - "Service component CRUD uses direct mutations (discrete actions) not debounced autosave"
  - "base-ui Accordion uses multiple prop (not type='multiple' which is Radix-style)"
  - "base-ui Select onValueChange returns string|null -- handled with ?? '0' fallback before parseInt"
  - "Maintenance slider displays 0-10% range but stores as decimal 0-1 via /100 conversion in onSave"

patterns-established:
  - "Imperative detail row pattern: defaultValue + onBlur/onValueChange with debounced mutation (no useForm for high-cardinality rows)"
  - "Combobox pattern: base-ui Popover + cmdk Command with data-checked attribute for selection state"
  - "Energy consumption table: flat form schema with named fields (heating1/heating2) mapped to endUse enum array in onSave"

requirements-completed: [UI-10, UI-11]

duration: 14min
completed: 2026-03-27
---

# Phase 8 Plan 04: Construction & Energy Forms Summary

**Construction form with 21 accordion cost categories, detail row CRUD with debounced upsert, EN 15459 searchable combobox for service components, and energy form with dual-system consumption table, PV production, and maintenance slider**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-27T17:19:52Z
- **Completed:** 2026-03-27T17:34:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Construction form with 21 cost categories organized in 5 accordion groups (Building Elements, Building Services, Renewable Energy, Furnishings, Outdoor)
- Detail row expansion with add/delete per category, debounced 500ms mutation for field changes, resolved cost display (MAX(material, unit*area))
- Service component section for B/C categories with EN 15459 searchable combobox showing lifespan and maintenance info
- Energy consumption table with dual-system (System 1/2) inputs for heating, cooling, DHW, single system for household electricity
- PV production dedicated field with kWh/year input
- Maintenance config with SliderInput (0-10% range, stored as 0-1 decimal)

## Task Commits

Each task was committed atomically:

1. **Task 1: Construction form with 21 category accordions, detail rows, and EN 15459 combobox** - `1235faf` (feat)
2. **Task 2: Energy form with consumption table, PV production, and maintenance config** - `14e35cb` (feat)

## Files Created/Modified
- `src/app/(app)/projects/[id]/construction/page.tsx` - Thin page wrapper reading variant ID from URL params
- `src/components/forms/construction-form.tsx` - Construction form with 21 accordion categories, detail rows, service components
- `src/components/forms/shared/en15459-combobox.tsx` - Searchable combobox for 80+ EN 15459 HVAC components
- `src/app/(app)/projects/[id]/energy/page.tsx` - Thin page wrapper reading variant ID from URL params
- `src/components/forms/energy-form.tsx` - Energy form with consumption table, PV production, maintenance slider

## Decisions Made
- Construction detail rows use imperative per-detail debounce with refs (not RHF useAutosave) because the high-cardinality row structure maps poorly to a single useForm
- Service component CRUD uses direct mutations (discrete add/update/delete actions) rather than debounced autosave
- base-ui Accordion uses `multiple` prop (boolean) not Radix-style `type="multiple"` string
- base-ui Select `onValueChange` returns `string | null` not just `string` -- handled with nullish coalescing
- Maintenance percentage displayed as 0-10% range on slider but stored as 0-0.1 decimal via division in onSave callback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed upsertCostItem return type missing details property**
- **Found during:** Task 1 (TypeScript build)
- **Issue:** `upsertCostItem.mutateAsync` returns raw Prisma CostItem without `details` array, but the code tried to assign it to the local `CostItem` type which includes details
- **Fix:** Separated into `existing` (from query, has details) and `created` (from mutation, only needs id), avoiding type mismatch
- **Files modified:** src/components/forms/construction-form.tsx
- **Verification:** Build passes
- **Committed in:** 1235faf (Task 1 commit)

**2. [Rule 1 - Bug] Fixed base-ui Accordion `type` prop not recognized**
- **Found during:** Task 1 (TypeScript build)
- **Issue:** base-ui Accordion Root uses `multiple` boolean prop, not Radix-style `type="multiple"` string
- **Fix:** Changed `<Accordion type="multiple">` to `<Accordion multiple>`
- **Files modified:** src/components/forms/construction-form.tsx
- **Verification:** Build passes
- **Committed in:** 1235faf (Task 1 commit)

**3. [Rule 1 - Bug] Fixed base-ui Select onValueChange type: string|null**
- **Found during:** Task 2 (TypeScript build)
- **Issue:** base-ui Select `onValueChange` provides `string | null` but `parseInt` expects `string`
- **Fix:** Added nullish coalescing: `parseInt(v ?? "0", 10)`
- **Files modified:** src/components/forms/energy-form.tsx
- **Verification:** Build passes
- **Committed in:** 14e35cb (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs -- all base-ui/Prisma type mismatches)
**Impact on plan:** All auto-fixes necessary for TypeScript compilation correctness. No scope creep.

## Issues Encountered
- EN 15459 combobox and construction form files already existed from a prior session but were uncommitted; included in Task 1 commit
- Unused imports (useState, CurrencyInput) cleaned up in construction form

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 wizard data entry steps complete (Info, WLC, Construction, Energy)
- 08-05 (Results page) has all prerequisite data entry pages ready
- Construction and energy data now available for LCC calculation engine

## Self-Check: PASSED

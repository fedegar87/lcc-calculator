---
phase: 16-gap-analysis-fixes
plan: 02
subsystem: ui
tags: [energy-form, construction-form, maintenance-config, slider, gap-analysis]

# Dependency graph
requires:
  - phase: 08-ui-implementation
    provides: Energy form with MaintenanceConfigSection, Construction form with category accordions
provides:
  - MaintenanceConfigSection moved to Construction form
  - Energy form cleaned of maintenance concerns
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/forms/energy-form.tsx
    - src/components/forms/construction-form.tsx

key-decisions:
  - "MaintenanceConfigSection placed after all category accordion groups in Construction form"
  - "Guarded with {variant && ...} since variant is fetched async"

patterns-established: []

requirements-completed: [GAP-02]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 16 Plan 2: Move MaintenanceConfig to Construction Form Summary

**MaintenanceConfig slider removed from Energy form and added to Construction form — logically groups maintenance with construction costs**

## Performance

- **Duration:** 2 min
- **Files modified:** 2

## Accomplishments
- Removed MaintenanceConfigSection function, maintenanceSchema, MaintenanceValues type from energy-form.tsx
- Removed SliderInput import (unused after removal) from energy-form.tsx
- Removed MaintenanceConfigSection JSX from EnergyForm return
- Added useForm, z, zodResolver, useAutosave, SliderInput, InfoTooltip imports to construction-form.tsx
- Added maintenanceSchema and MaintenanceValues type to construction-form.tsx
- Added MaintenanceConfigSection function (identical logic) to construction-form.tsx
- Placed section after GROUP_ORDER.map() in ConstructionForm return

## Task Commits

1. **Task 1: Remove from energy, add to construction** - `4791e7b` (feat)

## Files Modified
- `src/components/forms/energy-form.tsx` — Removed MaintenanceConfigSection, schema, unused imports
- `src/components/forms/construction-form.tsx` — Added MaintenanceConfigSection with slider, schema, imports

## Deviations from Plan

None.

## Issues Encountered

None.

## Self-Check: PASSED

- Energy form no longer contains any maintenance-related code (grep confirms zero matches)
- Construction form contains working MaintenanceConfigSection with SliderInput (0-10%, step 0.1)
- Saves via existing variant.upsertMaintenanceConfig tRPC mutation
- Loads existing value from variant.maintenanceConfig (default 2%)
- TypeScript compilation clean (only pre-existing results/page.tsx export errors)
- 152/152 engine tests pass

---
*Phase: 16-gap-analysis-fixes*
*Completed: 2026-03-28*

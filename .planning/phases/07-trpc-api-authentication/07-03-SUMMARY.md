---
phase: 07-trpc-api-authentication
plan: 03
subsystem: api
tags: [trpc, zod, prisma, calculation-engine, variant, export]

requires:
  - phase: 07-trpc-api-authentication (07-01, 07-02)
    provides: tRPC init, protectedProcedure, role middleware, project/costItem/reference routers
  - phase: 04-calculation-engine
    provides: calculateLCC function, VariantInput/LCCResult types
  - phase: 03-schema-types-constants
    provides: Prisma schema models, engine types, EN15459 constants
provides:
  - variantRouter with 10 procedures (getById, 8 section upserts, service component CRUD)
  - calculationRouter with engine integration (DB to VariantInput conversion, LCCResult output)
  - exportRouter stubs for Phase 9
  - appRouter merging all 6 domain routers + healthcheck
  - AppRouter type for end-to-end client type safety
affects: [phase-08-ui-dashboard, phase-09-export]

tech-stack:
  added: []
  patterns: [per-section-upsert-mutations, decimal-to-number-conversion, replace-pattern-for-arrays, engine-integration-via-buildVariantInput]

key-files:
  created:
    - src/server/trpc/routers/variant.ts
    - src/server/trpc/routers/calculation.ts
    - src/server/trpc/routers/export.ts
  modified:
    - src/server/trpc/router.ts

key-decisions:
  - "createManyAndReturn for design cost replace pattern (atomic delete+create in transaction)"
  - "buildVariantInput as pure mapping function from Prisma models to engine VariantInput"
  - "WLC designCostsTotal/siteManagementCostsTotal computed from design costs array at calculation time"
  - "Income input included only when any rent/income value is non-zero"
  - "Cost item detail MAX(mat, unit*area) resolution done in buildVariantInput, matching tRPC layer pattern"

patterns-established:
  - "Per-section upsert: each wizard step maps to one mutation with Zod validation"
  - "Replace pattern: delete+recreate in transaction for 1:N relations (design costs)"
  - "Decimal conversion: d() helper in every router, serialize* helpers for complex models"
  - "Engine integration: single buildVariantInput function handles all DB-to-engine mapping"

requirements-completed: [API-03, API-05, API-07]

duration: 7min
completed: 2026-03-27
---

# Phase 7 Plan 3: Variant/Calculation/Export Routers + App Router Summary

**Variant data upsert router (10 procedures), calculation engine integration with Decimal-to-number conversion, export stubs, and all 6 routers merged into appRouter with AppRouter type export**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T10:02:23Z
- **Completed:** 2026-03-27T10:09:50Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Variant router with 10 procedures covering all data domains (geometry, boundary conditions, energy inputs, WLC, design costs, income, maintenance, service components)
- Calculation router that loads variant with all relations, converts Prisma Decimals, builds VariantInput, runs calculateLCC(), and returns full LCCResult
- Export router stubs (generatePdf, generateExcel) returning NOT_IMPLEMENTED for Phase 9
- All 6 domain routers + healthcheck merged into appRouter with AppRouter type export for end-to-end type safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Create variant router with per-section upsert mutations** - `2ed1207` (feat)
2. **Task 2: Create calculation router with engine integration and export stub** - `7f4db4c` (feat)
3. **Task 3: Merge all routers into app router** - `9c38914` (feat)

## Files Created/Modified
- `src/server/trpc/routers/variant.ts` - 10 procedures: getById, upsertGeometry, upsertBoundaryCondition, upsertEnergyInputs, upsertWLCInput, upsertDesignCosts, upsertIncomeInput, upsertMaintenanceConfig, upsertServiceComponent, deleteServiceComponent
- `src/server/trpc/routers/calculation.ts` - calculate query with buildVariantInput mapping and calculateLCC integration
- `src/server/trpc/routers/export.ts` - Stub router for Phase 9 (generatePdf, generateExcel)
- `src/server/trpc/router.ts` - Merged app router with all 6 sub-routers + healthcheck

## Decisions Made
- Used `createManyAndReturn` for design cost replace pattern (delete all + create many in transaction)
- Built `buildVariantInput` as a pure mapping function that handles all Prisma-to-engine conversion in one place
- WLC `designCostsTotal` and `siteManagementCostsTotal` computed at calculation time from design costs array (not stored)
- Income input only included when at least one rent/income value is non-zero (avoids engine processing empty data)
- Cost item detail resolution (MAX(materialCost, unitPrice*area)) done in buildVariantInput, consistent with cost-item router pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed redundant eslint-disable directive**
- **Found during:** Task 2 (calculation router)
- **Issue:** Duplicate eslint-disable-next-line comment that wasn't suppressing any actual warning
- **Fix:** Removed the redundant directive
- **Files modified:** src/server/trpc/routers/calculation.ts
- **Verification:** Next.js lint passes without the warning
- **Committed in:** 9c38914 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial lint fix. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in prisma.config.ts (migrate field) and tests/engine/edge-cases.test.ts (type cast) -- both unrelated to this plan, not addressed per scope boundary rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full tRPC API layer complete: project CRUD, variant data entry, cost items, calculation, reference data, export stubs
- All routers accessible via /api/trpc with end-to-end type safety
- Ready for Phase 8 UI implementation (dashboard, wizard steps, calculation results)
- Export stubs ready for Phase 9 implementation

## Self-Check: PASSED

All 5 files verified present. All 3 task commits verified in git log.

---
*Phase: 07-trpc-api-authentication*
*Completed: 2026-03-27*

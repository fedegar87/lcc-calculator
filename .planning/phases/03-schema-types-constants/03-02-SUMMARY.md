---
phase: 03-schema-types-constants
plan: 02
subsystem: engine
tags: [typescript, engine-types, en15459, validation, tdd]

requires:
  - phase: 02-excel-workbook-audit
    provides: EN 15459 JSON and energy sources JSON from extraction scripts
provides:
  - Pure TypeScript engine type interfaces (VariantInput, LCCResult, YearlyEnergyCosts)
  - EN 15459 HVAC components (79) and energy sources (18) as typed constants
  - Engine input validation with range checks
  - CATEGORY_MAINTENANCE_MAP and END_USE_PAIRS domain constants
affects: [04-calculation-engine, 05-engine-tests, 07-api-layer]

tech-stack:
  added: []
  patterns: [pure-engine-types, json-import-constants, plain-ts-validation, tdd]

key-files:
  created:
    - src/engine/types.ts
    - src/engine/constants.ts
    - src/engine/validation.ts
    - src/engine/__tests__/validation.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "FormulaMode as string literal union decoupled from Prisma enum"
  - "EN 15459 constants imported from audit JSON via resolveJsonModule"
  - "Plain TypeScript validation (not Zod) at engine layer per implementation plan"

patterns-established:
  - "Pure engine files: zero Prisma/framework imports in src/engine/"
  - "JSON constant import: camelCase mapping from snake_case audit output"
  - "Validation returns string[] (accumulates all errors, not fail-fast)"

requirements-completed: [DATA-07, DATA-08, DATA-09]

duration: 6min
completed: 2026-03-26
---

# Phase 3 Plan 2: Engine Types, Constants & Validation Summary

**Pure TypeScript engine types with 79 EN 15459 components from audit JSON, 18 energy sources, and TDD-validated input range checks**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T19:16:05Z
- **Completed:** 2026-03-26T19:21:40Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Defined complete VariantInput and LCCResult interfaces matching implementation plan with formula ID annotations
- Imported 79 EN 15459 HVAC components and 18 energy sources from Phase 2 audit JSON with zero manual transcription
- TDD-driven input validation covering reference period, rates, floor area, energy source indexes, duplicate detection, component indexes, non-negative costs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create engine type interfaces and domain constants** - `ad83327` (feat)
2. **Task 2: Import EN 15459 constants and energy sources from audit JSON** - `9a193b4` (feat)
3. **Task 3: Create engine input validation with range checks (TDD)**
   - RED: `c29a830` (test) - 15 failing tests
   - GREEN: `8c869e0` (feat) - all 17 tests pass

## Files Created/Modified

- `src/engine/types.ts` - Pure TS interfaces: FormulaMode, EngineConfig, VariantInput, LCCResult, YearlyEnergyCosts, CATEGORY_MAINTENANCE_MAP, END_USE_PAIRS
- `src/engine/constants.ts` - EN15459_COMPONENTS (79), ENERGY_SOURCES (18), lookup helpers
- `src/engine/validation.ts` - validateVariantInput() with plausible range checks
- `src/engine/__tests__/validation.test.ts` - 17 test cases covering all validation rules
- `vitest.config.ts` - Added src/**/__tests__ include pattern

## Decisions Made

- FormulaMode defined as `'excel_replica' | 'excel_bugfixed'` string literal union (not imported from Prisma) -- maintains engine purity
- EN 15459 data imported directly from audit JSON using resolveJsonModule -- eliminates transcription errors across 79 components
- Plain TypeScript validation (returns string[]) per implementation plan, not Zod -- Zod reserved for API boundary in Phase 7

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated vitest config to include src/__tests__ pattern**
- **Found during:** Task 3 (validation tests)
- **Issue:** vitest.config.ts only included `tests/**/*.test.ts`, plan puts tests at `src/engine/__tests__/`
- **Fix:** Added `src/**/__tests__/**/*.test.ts` to vitest include array
- **Files modified:** vitest.config.ts
- **Verification:** All 17 tests discovered and run successfully
- **Committed in:** c29a830 (Task 3 RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to support colocated test files. No scope creep.

## Issues Encountered

- `npx tsc --noEmit src/engine/constants.ts` fails when passing a single file (bypasses tsconfig resolveJsonModule). Verified via `npx tsc --project tsconfig.json --noEmit` which correctly resolves JSON imports.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine type system complete: VariantInput and LCCResult define the full I/O contract
- Constants ready: EN 15459 components and energy sources available for engine calculations
- Validation ready: input range checks available for API layer integration
- Phase 4 (calculation engine) can implement against these interfaces

## Self-Check: PASSED

All 6 files verified present. All 4 commits verified in git log.

---
*Phase: 03-schema-types-constants*
*Completed: 2026-03-26*

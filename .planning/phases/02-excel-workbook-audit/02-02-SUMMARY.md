---
phase: 02-excel-workbook-audit
plan: 02
subsystem: documentation
tags: [formula-map, architecture-decisions, lcc, en15459, excel-audit]

requires:
  - phase: 02-excel-workbook-audit
    provides: Raw formula JSON, EN 15459 JSON, energy sources JSON from Plan 02-01
provides:
  - Complete formula reference with 39 IDs across 7 modules
  - Architecture decisions DEC-001 through DEC-010 with workbook evidence
  - Variant column/row mapping for all 4 data sheets
  - 4 confirmed bugs documented with cell references and impact analysis
affects: [03-schema-types-constants, 04-calculation-engine, 05-engine-tests]

tech-stack:
  added: []
  patterns: [ADR format for architecture decisions, formula classification (EXCEL_REPLICA/EXCEL_BUG_FIX/METHOD_IMPROVEMENT)]

key-files:
  created:
    - docs/formula-map.md
    - docs/architecture-decisions.md

key-decisions:
  - "KPI ratios divide by investment cost (B63), not LCC (B62) -- matches Excel, documented discrepancy"
  - "All 4 bugs (MNT-BUG-001, NRG-BUG-001, NRG-BUG-002, MNT-BUG-002) documented with cell-level evidence"

patterns-established:
  - "Formula classification: EXCEL_REPLICA for exact copies, METHOD_IMPROVEMENT for new calculations, EXCEL_BUG_FIX for corrected bugs"
  - "ADR structure: Status, Context, Decision, Rationale (with evidence), Consequences"

requirements-completed: [AUDIT-04, AUDIT-05]

duration: 6min
completed: 2026-03-26
---

# Phase 2 Plan 02: Formula Map & Architecture Decisions Summary

**39 formula IDs across 7 modules with variant mapping, 10 ADRs with workbook evidence, and 4 confirmed bugs documented**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T13:57:00Z
- **Completed:** 2026-03-26T14:03:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Formula map documents all 39 formula IDs (FIN-001..002, NRG-001..007, MNT-001..004, CAL-001..008, AGG-001..014, RES-001, INC-001..003)
- All 4 confirmed bugs documented with cell references, formula text, impact analysis, and affected scope
- Variant column/row mapping covers PI, Calc, Maintenance, and Results sheets for all 3 variants
- 10 architecture decisions as structured ADRs with workbook cell references as evidence
- 3 open questions documented with recommendations

## Task Commits

Each task was committed atomically:

1. **Task 1: Formula map document** - `90fc403` (docs)
2. **Task 2: Architecture decisions document** - `d1730ca` (docs)

## Files Created/Modified
- `docs/formula-map.md` - Complete formula reference for calculation engine (39 IDs, 4 bugs, variant mapping)
- `docs/architecture-decisions.md` - DEC-001 through DEC-010 as structured ADRs

## Decisions Made
- KPI ratio divisor uses investment cost (B63 = construction + design + site_mgmt) not LCC (B62), matching Excel behavior
- All formula cell references cross-verified against formulas_raw.json (23,668 extracted cells)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Formula map and architecture decisions are the definitive references for Phase 4 (engine implementation)
- EN 15459 JSON ready for Phase 3 (Prisma schema constants)
- All AUDIT requirements (01-05) complete
- Phase 2 complete, ready for transition to Phase 3

---
*Phase: 02-excel-workbook-audit*
*Completed: 2026-03-26*

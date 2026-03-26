---
phase: 02-excel-workbook-audit
plan: 01
subsystem: data-extraction
tags: [openpyxl, python, excel, json, en15459]

requires:
  - phase: 01-project-scaffolding
    provides: Git repository and project structure
provides:
  - EN 15459 HVAC component table as validated JSON (79 components)
  - Energy source list as validated JSON (19 entries)
  - Raw formula dump from all 7 Excel sheets (23,668 formulas)
affects: [02-excel-workbook-audit, 03-schema-types-constants, 04-calculation-engine, 05-engine-tests]

tech-stack:
  added: [openpyxl 3.1.5]
  patterns: [dual-pass extraction, assertion-based validation, metadata envelope JSON]

key-files:
  created:
    - scripts/audit/extract_en15459.py
    - scripts/audit/extract_energy_sources.py
    - scripts/audit/extract_formulas.py
    - scripts/output/en15459.json
    - scripts/output/energy_sources.json
    - scripts/output/formulas_raw.json

key-decisions:
  - "Dual-pass extraction pattern for all scripts: data_only=False for formulas, data_only=True for cached values"
  - "1-based indexing in EN 15459 and energy sources to match Excel INDEX() function usage"

patterns-established:
  - "Metadata envelope: all JSON outputs wrapped in {source, extracted_from, extraction_date, count, data}"
  - "Assertion-based validation: scripts assert expected counts and boundary values before writing output"

requirements-completed: [AUDIT-01, AUDIT-02, AUDIT-03]

duration: 8min
completed: 2026-03-26
---

# Phase 2 Plan 01: Excel Data Extraction Summary

**Three openpyxl scripts extracting EN 15459 table (79 components), energy sources (19 entries), and all formulas (23,668 cells) from CRAVEzero workbook to validated JSON**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T13:48:00Z
- **Completed:** 2026-03-26T13:56:44Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- EN 15459 HVAC component table extracted with lifespan and maintenance percentage data for all 79 components
- Energy source list extracted with correct category classification (fuel_source vs energy_carrier) and header row flagging
- Complete formula dump from all 7 sheets capturing both formula text and cached computed values
- All assertions pass: correct counts, boundary values, first/last entry validation

## Task Commits

Each task was committed atomically:

1. **Task 1: EN 15459 and energy sources extraction** - `f627d85` (feat)
2. **Task 2: Formula extraction with dual-pass** - `4367869` (feat)

## Files Created/Modified
- `scripts/audit/extract_en15459.py` - Extracts 79 HVAC components from Calc!B405:H483
- `scripts/audit/extract_energy_sources.py` - Extracts 19 energy sources from PI!C131:C149
- `scripts/audit/extract_formulas.py` - Dual-pass extraction of all 23,668 formula cells across 7 sheets
- `scripts/output/en15459.json` - 79 components with lifespan min/max/avg and maintenance pct min/max/avg
- `scripts/output/energy_sources.json` - 19 sources with index, name, category, is_header flag
- `scripts/output/formulas_raw.json` - Per-sheet formula data with cell reference, formula text, and cached value

## Decisions Made
- Used 1-based indexing for both EN 15459 components and energy sources to match Excel INDEX() function behavior
- Chimney (row 414) correctly handled with None maintenance values
- Charts sheet included in extraction (0 formulas found, as expected)
- Custom JSON encoder for datetime cached values in formula extraction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 JSON files ready for Plan 02-02 (formula map and architecture decisions)
- formulas_raw.json provides cross-reference data for verifying formula IDs against actual Excel cells
- en15459.json ready for Phase 3 (schema constants) and Phase 4 (engine lookup)

---
*Phase: 02-excel-workbook-audit*
*Completed: 2026-03-26*

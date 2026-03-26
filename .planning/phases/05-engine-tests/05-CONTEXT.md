# Phase 5: Engine Tests - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 5)

<domain>
## Phase Boundary

This phase validates the calculation engine (Phase 4) against a golden dataset extracted from the Excel workbook. After completion, every formula ID has at least one test, `calculateLCC()` is proven correct against Excel values, formula mode toggle is verified, and edge cases don't crash. No new engine code — only test files and fixture data.

</domain>

<decisions>
## Implementation Decisions

### Golden Fixture (from implementation plan TASK 5.1)
- Open the Excel file programmatically or use pre-extracted data from `scripts/output/formulas_raw.json`
- Record ALL values: yearly energy prices, yearly energy costs (nominal, actualized, cumulated), yearly maintenance costs, construction breakdown by category, LCC components, WLC, KPIs
- Save to `tests/fixtures/excel-reference.json`
- The fixture contains BOTH the input (VariantInput) and expected output (LCCResult-like structure)
- Use Base variant (column D-K in Excel) as the golden reference

### Unit Tests (from implementation plan TASK 5.2)
- One test file per module, using values from golden fixture
- Tolerance: +/- 0.01 EUR for intermediate values, exact match (after rounding to 2 decimals) for final totals
- Test files:
  - `tests/engine/discount.test.ts` — FIN-001, FIN-002
  - `tests/engine/energy.test.ts` — NRG-001 through NRG-007
  - `tests/engine/maintenance.test.ts` — MNT-001 through MNT-004
  - `tests/engine/aggregate.test.ts` — AGG-001 through AGG-014, CAL-001..008
  - `tests/engine/residual.test.ts` — RES-001 (hand-calculated, no Excel reference)
  - `tests/engine/income.test.ts` — INC-001..003 (hand-calculated, no Excel reference)
- Vitest is already configured (Phase 1)

### Integration Test (from implementation plan TASK 5.3)
- `tests/engine/integration.test.ts`: feeds full golden fixture input into `calculateLCC()` and validates every output field
- Validates the complete pipeline end-to-end

### Formula Mode Test (from implementation plan TASK 5.4)
- `calculateLCC(input, { formulaMode: 'excel_replica' })` must produce the Excel-buggy value for MNT-BUG-001
- `calculateLCC(input, { formulaMode: 'excel_bugfixed' })` must produce the corrected value
- The two values must differ (this proves the toggle works)

### Edge Case Tests (from implementation plan TASK 5.5)
- `treatedFloorArea = 0` — KPIs return null, no crash
- `referencePeriod = 1` — minimal period
- No energy inputs — energy costs = 0
- No service components — service maintenance = 0
- No income data — income analysis = null
- All zero costs — LCC = 0, payback = null

### Key Constraints
- Engine is pure TypeScript — tests run with Vitest, no database needed
- Existing `src/engine/__tests__/validation.test.ts` has 17 passing tests (from Phase 3)
- Test location: `tests/engine/` directory (following implementation plan convention)
- Residual and income modules are METHOD_IMPROVEMENT — no Excel reference values exist, test against hand-calculated expected values

### Claude's Discretion
- How to structure the golden fixture JSON (flat vs nested)
- Whether to create a shared test helper for tolerance checking
- How to extract golden values (manually from Excel vs programmatically from formulas_raw.json)
- Whether to use `describe`/`it` nesting or flat test structure
- Exact hand-calculated values for residual and income tests
- Whether to move the existing validation tests to tests/engine/ for consistency

</decisions>

<specifics>
## Specific Ideas

- The existing `src/engine/__tests__/validation.test.ts` already passes 17 tests
- `scripts/output/formulas_raw.json` has 23,668 extracted formulas with cached values — can be used to derive golden fixture values
- `docs/formula-map.md` has all 39 formula IDs with cell references — use to cross-reference expected values
- MNT-BUG-001: In excel_replica mode, last service component uses exponent 9 (column I header) — test must verify this
- KPI divisor is investmentCost (construction + design + site mgmt), NOT LCC — research finding from Phase 4
- PV always uses energy source index 13 for price escalation

</specifics>

<deferred>
## Deferred Ideas

- Performance benchmarks (not needed for correctness)
- Property-based / fuzz testing (nice-to-have for v2)
- Snapshot tests for LCCResult structure (brittle, avoid)

</deferred>

---
*Phase: 05-engine-tests*
*Context gathered: 2026-03-26 via PRD Express Path*

# Architecture Decisions

Decisions derived from the CRAVEzero Excel workbook audit.
Each decision is numbered DEC-001 through DEC-014.

**Source documents:**
- `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` (workbook)
- `llc-implementation-plan.md` (v4)
- `.planning/phases/02-excel-workbook-audit/02-RESEARCH.md`

---

## DEC-001: Numeric Types

**Status:** Accepted

**Context:** The calculation engine handles monetary values, interest rates, energy prices, and area measurements. Floating-point precision errors can accumulate across database writes and multi-year calculations.

**Decision:** Use Prisma `Decimal` for all monetary values, rates, and energy prices in the database. Use standard JavaScript `number` (IEEE 754 double) in the calculation engine with controlled rounding at output boundaries.

**Rationale:** Building LCC precision requirements are met by IEEE 754 double -- we're computing 30-year building cost projections, not sub-cent financial trading. Decimal in the DB prevents accumulation errors across writes. The engine applies `Math.round(value * 100) / 100` at output boundaries.

**Consequences:**
- Prisma schema uses `Decimal` type for cost fields, rates, and prices
- Engine functions accept and return plain `number` types
- tRPC layer converts between Decimal and number at the boundary
- Rounding strategy documented in engine module headers

---

## DEC-002: Formula Mode

**Status:** Accepted

**Context:** The Excel workbook contains confirmed bugs (MNT-BUG-001, NRG-BUG-001, NRG-BUG-002, MNT-BUG-002). Users may want to verify their calculations match the original Excel exactly, or use corrected formulas.

**Decision:** Engine accepts a `formulaMode` parameter: `'excel_replica'` | `'excel_bugfixed'`. Default: `'excel_bugfixed'`. Every ResultSnapshot records the mode used.

**Rationale:**
- `excel_replica` reproduces all Excel behavior including bugs, enabling verification against the original workbook
- `excel_bugfixed` corrects known bugs while maintaining the same methodology
- MNT-BUG-001 (Maintenance!I62 exponent) is the primary mode toggle target
- NRG-BUG-001, NRG-BUG-002, MNT-BUG-002 are also candidates for mode-dependent behavior

**Consequences:**
- Engine functions check `formulaMode` at each bug-affected calculation point
- Snapshots include `formulaMode` in metadata for reproducibility
- Test suite validates both modes against known values

---

## DEC-003: Replacement Cycle Cap

**Status:** Accepted

**Context:** Building services (EN 15459 components) are replaced at multiples of their lifespan. The Excel workbook checks only 1x, 2x, 3x lifespan using `IF(OR(year=lifespan, year=lifespan*2, year=lifespan*3), ...)`.

**Decision:** Engine uses `year % lifespan === 0` with a `maxReplacements` parameter (default 3) for Excel compatibility. When `maxReplacements` is removed or set higher, this becomes a METHOD_IMPROVEMENT.

**Rationale:**
- Evidence: MNT-004 formula `=IF(OR(I5=$H$37, I5=($H$37*2), I5=($H$37*3)), ...)` in Maintenance sheet
- Generic modulo is cleaner and supports longer reference periods (>3x lifespan)
- Default cap of 3 matches Excel for verification

**Consequences:**
- Engine function signature includes optional `maxReplacements` parameter
- Default value matches Excel (3 replacements max)
- Future improvement: remove cap for reference periods exceeding 3x component lifespan

---

## DEC-004: Year Indexing

**Status:** Accepted

**Context:** The calculation timeline spans from construction (year 0) through the reference period (e.g., year 30).

**Decision:** Year 0 = construction year with discount factor = 1.0. Operational costs (energy, maintenance) start at year 1.

**Rationale:**
- Evidence: Calc!D7 = 0 (first year value), with discount factor Calc!D8 = 1.0
- Energy cost rows start from column E (year 1), column D is year 0 with no operational costs
- Construction costs are applied at year 0 (undiscounted)

**Consequences:**
- Engine arrays are 0-indexed where index = year number
- Year 0 contains only construction costs and discount factor 1.0
- All iterative calculations (energy escalation, maintenance, cumulation) start at year 1

---

## DEC-005: Maintenance Discount Rate Asymmetry

**Status:** Accepted

**Context:** The workbook uses two different discount rates for different cost categories.

**Decision:** Maintenance costs are discounted with Rint (nominal interest rate). Energy costs are discounted with RR (real interest rate). This asymmetry is intentional and replicated in the engine.

**Rationale:**
- Evidence: `Maintenance!D5` references `'Project Information'!D121` (Rint, nominal rate)
- Evidence: `Calc!D8` references `'Project Information'!D125` (RR, real rate)
- The distinction makes economic sense: maintenance costs include inflation (nominal), while energy analysis already accounts for real price escalation

**Consequences:**
- Engine must receive both Rint and RR as inputs
- Maintenance module uses Rint for discounting
- Energy module uses RR for discounting
- Both rates derived from FIN-001 (real interest rate calculation)

---

## DEC-006: Residual Value (METHOD_IMPROVEMENT)

**Status:** Accepted

**Context:** The Excel workbook has a "RESIDUAL VALUE" header in Construction cost column BC, but all data cells are empty. The Results sheet has no formula referencing column BC.

**Decision:** Implement residual value calculation per ISO 15686-5:
```
residual = cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod
```
Applied only to building services (categories B*, C*) that have a defined EN 15459 lifespan.

**Rationale:**
- Evidence: `Construction cost!BC2 = "RESIDUAL VALUE"`, all data cells below are `None`
- Evidence: No Results formula references any column BC cell
- ISO 15686-5 defines the standard methodology for building service life residual value
- Building elements (categories A*) use the reference period as effective lifespan, yielding residual = 0

**Consequences:**
- Engine includes RES-001 formula as a distinct module
- Residual value is subtracted from LCC (reduces total cost)
- Classification: METHOD_IMPROVEMENT (not in Excel)
- Every snapshot documents whether residual value was applied

---

## DEC-007: Income Analysis (METHOD_IMPROVEMENT)

**Status:** Accepted

**Context:** The Excel workbook collects income data in PI rows 84-113 (3 rent entries, 3 other income entries, total annual income) but no Results formula references any income cell.

**Decision:** Implement three income KPIs:
- INC-001: Net annual income = `sum(monthly_rent * area * 12 - taxes) + sum(other_income - taxes)`
- INC-002: Simple payback period = `LCC / net_annual_income` (years)
- INC-003: NPV of income stream = `sum(income / (1+RR)^year)` for years 1..refPeriod

**Rationale:**
- Evidence: PI rows 88, 91, 94 collect rent data; rows 100, 103, 106 collect other income; row 109 has total formula
- Evidence: No Results sheet formula references any PI income cell (verified via formulas_raw.json)
- Income analysis is standard in LCC methodology and the data is already collected

**Consequences:**
- These are informational KPIs shown in Results, NOT part of WLC/LCC totals
- Classification: METHOD_IMPROVEMENT
- Engine returns income metrics as separate fields in LCCResult
- UI displays income analysis in a dedicated section

---

## DEC-008: Cost Category to Maintenance Mapping

**Status:** Accepted

**Context:** The 21 construction cost categories have different maintenance treatment based on their type.

**Decision:** Categories are mapped as follows:
- **A1-A10** (building elements): flat percentage annual maintenance from PI!D175
- **B1-B6, C1-C3** (building services/RES): EN 15459 lookup (lifespan and maintenance %)
- **D1, E1** (furnishings/outdoor): no maintenance

**Rationale:**
- Evidence: Construction cost sheet structure: categories A (elements) in rows 4-25, B (services) in rows 27-44, C (RES) in rows 46-52, D in row 53, E in row 54
- Evidence: Maintenance sheet elements rows (7-36) use flat % from column G; services rows (37-63) use EN 15459 INDEX lookup from column D/F/H
- This mapping is consistent across all 3 variants

**Consequences:**
- Engine hardcodes category-to-maintenance-type mapping as a constant
- Building elements: `annual_cost = construction_cost * maintenance_percentage`
- Building services: `annual_cost = construction_cost * en15459_maintenance_pct` with replacement at lifespan intervals
- D1, E1: excluded from maintenance calculations entirely

---

## DEC-009: Interest Rate UX Format

**Status:** Accepted

**Context:** The Excel workbook stores interest rates in an unusual format -- as basis points in the Calc sheet, then converts to decimals in the PI sheet.

**Decision:** Web app accepts percentage input (e.g., 1.51) and converts to decimal (0.0151) before storing in DB and passing to engine.

**Rationale:**
- Evidence: `Calc!C3 = 151` (basis points for 1.51%)
- Evidence: `PI!D121 = Calc!C3/10000` (converts to decimal 0.0151)
- Percentage input is the most intuitive UX for interest rates
- The conversion formula (divide by 100) is simpler than the Excel approach (divide by 10000)

**Consequences:**
- Form input: percentage (e.g., "1.51" with % suffix label)
- Database storage: decimal (0.0151)
- Engine receives: decimal (0.0151)
- No basis point handling needed in the web app

---

## DEC-010: Building Site Management Separation

**Status:** Accepted

**Context:** The LCC formula in the Results sheet treats design costs and building site management as separate components.

**Decision:** Design costs (Results!B57) and building site management (Results!B61) are SEPARATE LCC components. The engine returns both as distinct fields.

**Rationale:**
- Evidence: LCC formula `Results!B62 = B57 + B65 + B76 + B61` has 4 terms:
  - B57 = design costs (SUM of preliminary + definitive + executive design fees)
  - B65 = construction total (materials + labor)
  - B76 = O&M (energy consumed - produced + maintenance)
  - B61 = building site management (from WLC!J84)
- These are conceptually different: design fees are professional services, site management is construction oversight

**Consequences:**
- LCCResult type includes separate `designCosts` and `siteManagement` fields
- LCC = designCosts + constructionTotal + operationAndMaintenance + siteManagement
- WLC = LCC + nonConstructionCosts
- UI displays all 4 LCC components distinctly in the breakdown view

---

## DEC-011: FIN-001 Mode Split

**Status:** Accepted

**Context:** The workbook computes `Project Information!D125 = (D121-D123)/(1+(D123/100))`, which is the replica target, but that denominator is not the textbook Fisher equation when the app already stores `Ri` as a decimal.

**Decision:** `excel_replica` reproduces the workbook denominator `1 + Ri/100`. `excel_bugfixed` uses the mathematically correct Fisher form `1 + Ri`.

**Rationale:**
- Workbook parity matters for forensic comparison and migration confidence.
- The web app's bugfixed mode is meant to preserve intent, not spreadsheet quirks.
- This keeps replica outputs aligned with cached workbook values while letting bugfixed mode use economically correct discounting.

**Consequences:**
- `computeRealInterestRate()` branches on `formulaMode`
- Energy, residual, and income calculations inherit the replica-vs-bugfixed RR difference
- Tests must cover both mode paths explicitly

---

## DEC-012: `otherCost` Mode Semantics

**Status:** Accepted

**Context:** The web app schema intentionally tracks `otherCost` per construction detail row, but the workbook Results sheet aggregates only material + labor. Including `otherCost` unconditionally breaks replica parity.

**Decision:** `excel_replica` excludes `otherCost` from workbook-derived construction, maintenance, KPI, LCC, and WLC totals. `excel_bugfixed` includes `otherCost` as a web-app extension.

**Rationale:**
- Replica mode must match workbook semantics exactly.
- Bugfixed mode is allowed to extend the data model as long as the behavior is explicit.
- This avoids silently dropping information from the web app while preserving a true workbook-comparison path.

**Consequences:**
- Construction aggregation helpers branch on `formulaMode`
- Building-element maintenance uses the mode-correct construction base
- KPI denominators and downstream totals remain internally consistent per mode

---

## DEC-013: `excel_replica` Maintenance Bug Targeting via `replicaOrder`

**Status:** Accepted

**Context:** The workbook bug MNT-BUG-001 lives on a physical cell (`Maintenance!I62`), not on a specific component identity. The engine has to decide which logical service component inherits the bug in `excel_replica` mode. An earlier implementation used array-position (last element), which made replica output depend on whichever order Prisma happened to return.

**Decision:** Service components expose an optional `replicaOrder` field. The engine sorts on `replicaOrder` first, then falls back to a deterministic key (`name` -> `en15459ComponentIndex` -> `constructionCost`). The bug is applied to the last component after sorting. The tRPC layer populates `replicaOrder` with the DB query index so that replica output is stable for a given persistent state.

**Rationale:**
- Workbook row 62 is a physical position, so tying the bug to a stable user-facing order is semantically honest.
- The deterministic fallback keeps tests and fixtures reproducible even when `replicaOrder` is absent.
- Pushing ordering into a dedicated field avoids brittle reliance on input-array position.

**Consequences:**
- Replica output is stable as long as the persisted `replicaOrder` is stable.
- If the UI later exposes drag-reorder of service components, the component inheriting the bug can change — this is acceptable because it mirrors the "physical row" semantics of the workbook, but UX should make the effect explicit.
- Fixtures that omit `replicaOrder` rely on the deterministic fallback and must keep the fallback keys unique.

---

## DEC-014: Workbook Parity Fixture Coverage

**Status:** Accepted (with documented follow-up)

**Context:** The prior audit flagged that `tests/fixtures/excel-reference.json` was auto-generated from the engine itself, making every "pass" meaningless as a parity test. The fix re-derives the fixture directly from workbook cached values via `scripts/generate-excel-reference-fixture.py`, and the regression-only fixture moves to `tests/fixtures/formula-regression.json`.

**Decision:** The workbook-backed fixture currently covers only the CRAVEzero base template (empty inputs), which yields exact parity on the real interest rate and the full discount-factor series at 12-decimal precision, plus all-zero aggregates as a sanity check. Filled case-study workbooks (Väla Gård, Héliades, Aspern, Solallen) exist in `CRAVEzero/` and are already used as seed data (`prisma/seed-data/cravezero-*.ts`), but are not yet wired into the parity fixture.

**Rationale:**
- The narrow fixture is already sufficient to lock in FIN-001 mode semantics and kill the self-referential regression.
- Extending parity to a filled case study is substantial work (input mapping + cached-output extraction) and should land as its own phase rather than delay closing the audit.

**Consequences:**
- Workbook parity is **proven** for FIN-001 / FIN-002 only.
- Aggregate-level parity (LCC, WLC, O&M on non-empty data) is covered by the regression fixture and unit tests, not by direct workbook comparison.
- Future work: extend `scripts/generate-excel-reference-fixture.py` (or add a sibling script) to emit a filled-case-study fixture from one of the CRAVEzero reference workbooks, and add matching parity tests in `tests/engine/workbook-reference.test.ts`.

---

## References

- **Workbook:** `CRAVEzero/200512_LCC_tool_beta_v2.xlsm`
- **Implementation Plan:** `llc-implementation-plan.md` (v4, lines 583-645)
- **Research:** `.planning/phases/02-excel-workbook-audit/02-RESEARCH.md`
- **Formula Map:** `docs/formula-map.md` (39 formula IDs with cell references)
- **Audit reports:** `docs/backend-calculation-verification-report.md`, `docs/backend-calculation-followup-verification-report.md`

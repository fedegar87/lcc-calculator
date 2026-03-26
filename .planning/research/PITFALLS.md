# Pitfalls Research

**Domain:** Excel-to-web migration of nZEB Life-Cycle Cost financial calculator
**Researched:** 2026-03-26
**Confidence:** HIGH (domain-specific pitfalls verified against project context, standards, and multiple sources)

## Critical Pitfalls

### Pitfall 1: Off-by-one errors in discount factor exponent (Year 0 vs Year 1)

**What goes wrong:**
The discount factor `1 / (1 + r)^n` is applied with the wrong exponent, shifting all discounted costs by one year. In this project, Year 0 = construction (DEC-004), and operational costs start at Year 1. A common mistake is discounting the Year 1 cost with exponent 0 (no discounting) or the Year 0 cost with exponent 1 (discounting the initial investment). Over a 40-year reference period, a one-year shift in exponent produces a cumulative error of 2-5% in total present value depending on the discount rate.

**Why it happens:**
Excel uses row offsets (e.g., `D7` = Year 0, `E7` = Year 1) that implicitly encode the exponent via column position. When translating to code with a `for` loop (`for (let year = 0; year <= T; year++)`), the developer must manually map year index to exponent. It is easy to confuse "year index" (0-based loop counter) with "discounting period" (which may differ by 1). Additionally, ordinary annuity vs. annuity due conventions can add further confusion.

**How to avoid:**
- Make the exponent explicit in every formula function: `discountFactor(rate, year)` where `year` is the discounting period, not the loop index.
- Create a single `discountFactor` utility used everywhere, never inline `Math.pow(1 + r, -n)` ad-hoc.
- Write unit tests against known Excel cell values for Year 0, Year 1, Year 20, and Year 40 specifically.
- Document the convention: "Year 0 = construction, exponent 0 = no discounting. Year 1 = first operational year, exponent 1."

**Warning signs:**
- Total present value differs from Excel by a consistent multiplicative factor close to `(1 + r)` or `1 / (1 + r)`.
- Year 0 construction cost appears discounted in output when it should not be.
- Energy/maintenance present values are systematically higher or lower than Excel by ~2-4%.

**Phase to address:**
Engine core implementation (calculation engine). Must be locked down with tests before any UI work.

---

### Pitfall 2: Mixing nominal and real interest rates across cost categories

**What goes wrong:**
The engine applies the wrong rate type to a cost category, e.g., using the real rate (RR) for maintenance or the nominal rate (Rint) for energy. This project has a verified intentional asymmetry (DEC-005): maintenance uses Rint (nominal), energy uses RR (real). Applying the wrong rate produces errors that grow exponentially over the 40-year period and are extremely hard to detect because the output "looks plausible" but is silently wrong.

**Why it happens:**
In standard financial textbooks, the rule is simple: match rate type to cost type (real rates with real costs, nominal rates with nominal costs). The CRAVEzero Excel workbook deliberately uses a non-standard convention (nominal rate for maintenance, real rate for energy) that was verified as intentional. A developer unfamiliar with this convention may "fix" it to match textbook practice, or copy-paste a formula from the energy module into the maintenance module without changing the rate parameter.

**How to avoid:**
- Each engine formula function must take the rate as an explicit parameter (never import a global rate).
- Formula ID annotations (FIN-001, NRG-001, etc.) must document which rate each formula expects.
- Integration tests must verify: `maintenancePV(Rint=0.03, ...) !== maintenancePV(RR=0.03, ...)` when Rint !== RR.
- A regression test suite using the exact Excel workbook values with both rates must pass before the engine is considered complete.
- Add a comment in the engine explaining DEC-005 rationale so future developers don't "correct" it.

**Warning signs:**
- Maintenance and energy totals diverge from Excel in opposite directions (one too high, one too low).
- Changing only Rint affects energy costs (it should not).
- Changing only RR affects maintenance costs (it should not).

**Phase to address:**
Engine core implementation. Rate parameters must be part of the function signature from day one.

---

### Pitfall 3: Maintenance replacement cycle boundary errors

**What goes wrong:**
Component replacement occurs at year multiples of the component lifespan (e.g., a heat pump with 20-year lifespan is replaced at Year 20 and Year 40 in a 40-year study). The calculation engine gets wrong: (a) which years trigger replacement, (b) how many replacements are capped (DEC-003: max 3 by default), (c) whether a replacement at the exact end-year (Year 40 = Year T) should count, or (d) partial replacement logic.

**Why it happens:**
The Excel workbook uses `IF(OR(I=lifespan, I=2*lifespan, I=3*lifespan))` patterns that are conceptually simple but create subtle edge cases. The known Excel bug MNT-BUG-001 (`^(I)` instead of `^(I5)`) adds another dimension: the engine must support both buggy and fixed behavior. When translating to code, developers often use `year % lifespan === 0` which looks equivalent but differs at Year 0 (where `0 % anything === 0` triggers a false replacement) and at the boundary when `T / lifespan` is exact (e.g., 40/20 = 2 replacements, but the Excel IF(OR()) pattern caps at 3 regardless).

**How to avoid:**
- Implement replacement detection as: `year > 0 && year % lifespan === 0 && (year / lifespan) <= maxReplacements`.
- Write parameterized tests for every EN 15459 component lifespan value (15, 20, 25, 30 years) against a 40-year period.
- Test edge cases explicitly: Year 0 (no replacement), Year = lifespan (first replacement), Year = T (boundary), lifespan > T (no replacement ever), lifespan = 1 (replacement every year).
- Implement `formulaMode` parameter from the start: `excel_replica` uses the buggy exponent, `excel_bugfixed` uses the corrected one. Both must have their own test suite.

**Warning signs:**
- A component with lifespan = 40 shows a replacement cost at Year 0.
- Total replacement count differs from Excel (e.g., 3 vs 2 for a 15-year component over 40 years).
- Maintenance cost profile is flat when it should show periodic spikes.

**Phase to address:**
Engine core implementation, specifically the maintenance module. The `formulaMode` toggle must be designed into the engine interface, not bolted on later.

---

### Pitfall 4: IEEE 754 floating-point accumulation errors in 40-year summations

**What goes wrong:**
Summing 40+ years of discounted costs using JavaScript `number` type accumulates floating-point errors. While individual errors are ~10^-16, iterative operations like `totalPV += yearCost / (1 + r)^n` for n = 0..40 compound the error. The project decision DEC-001 explicitly chose JS `number` in the engine, relying on "controlled rounding at output boundaries." If rounding is not applied consistently, intermediate values drift and the final result differs from Excel by small but visible amounts (e.g., EUR 1,247,832.45 vs EUR 1,247,832.47).

**Why it happens:**
Excel internally uses the same IEEE 754 double precision, so in theory results should match. However, Excel applies internal rounding heuristics (it displays only 15 significant digits and rounds the 15th). JavaScript does not apply these same heuristics, so the raw accumulated result may differ at the last 1-2 decimal places. Developers then spend hours debugging a "formula error" that is actually a display/rounding discrepancy.

**How to avoid:**
- Define a rounding boundary contract: engine returns raw `number`, output layer rounds to 2 decimal places for display, Prisma `Decimal` for DB storage.
- Accept a tolerance in tests: `Math.abs(jsResult - excelResult) < 0.01` for monetary values, not strict equality.
- Use Kahan summation algorithm for long summation chains (40+ terms) if tolerance is too loose.
- Document expected precision: "Engine output matches Excel to +/- EUR 0.01 per cost item."
- Do NOT introduce Decimal.js in the engine to "fix" this. The overhead is unnecessary for building LCC precision (tens of thousands of EUR, not sub-cent precision). DEC-001 is correct.

**Warning signs:**
- Tests fail with differences at the 2nd-3rd decimal place.
- Different cost categories show different magnitudes of drift (larger sums drift more).
- Attempting to achieve exact equality with Excel leads to fragile tests that break on different platforms.

**Phase to address:**
Engine core implementation (define tolerance contract), testing infrastructure (tolerance-based assertions).

---

### Pitfall 5: Variant comparison with shared vs. independent parameters

**What goes wrong:**
The 3-variant structure (BASE, VARIANT_1, VARIANT_2) shares some parameters (reference period, interest rates, climate data) but has independent values for others (construction costs, energy consumption, component selection). If the data model doesn't clearly separate shared from per-variant parameters, changing a shared parameter updates only one variant's calculation, or changing a per-variant parameter accidentally overwrites another variant.

**Why it happens:**
In Excel, shared parameters live in a single cell referenced by multiple sheets/sections. Per-variant parameters are in separate columns or sheets. This spatial organization is implicit. In a web application with a database, the developer must explicitly model this as either: (a) shared fields at the project level + per-variant fields in a variant table, or (b) all fields duplicated per variant with sync logic. Option (b) is a maintenance nightmare but is the path of least resistance when translating Excel columns to database columns.

**How to avoid:**
- Database schema must separate `Project` (shared params: reference period, rates, climate) from `Variant` (per-variant params: construction costs, energy data, component lists).
- Engine functions must accept shared params + variant params as separate arguments, never a merged object.
- UI must visually distinguish shared parameters (shown once, affects all variants) from per-variant parameters (shown in columns/tabs).
- Write a test: change a shared parameter, verify all 3 variant calculations update. Change a per-variant parameter, verify only that variant's calculation changes.

**Warning signs:**
- Changing the interest rate updates only the currently selected variant's results.
- Two variants show different reference periods (should be impossible).
- Database has 3x redundant storage of shared parameters with desynchronization.

**Phase to address:**
Database schema design and engine interface design. Must be decided before any CRUD implementation.

---

### Pitfall 6: Excel formula audit gap — untested formulas that "look right"

**What goes wrong:**
The project has 35+ documented formulas. The developer implements them, eyeballs the output ("looks about right"), and moves on. Months later, an edge case reveals that formula MNT-003 used addition where it should have used multiplication, but by then the formula is buried under UI and persistence layers. The fundamental problem: formulas pass the "smell test" at normal values but fail at boundaries.

**Why it happens:**
Financial formulas often produce plausible-looking numbers even when wrong. A discount factor of 0.67 vs 0.69 both "look reasonable" for Year 12 at ~3% rate. Unlike a UI bug (visually obvious) or a crash (immediately detected), a formula error produces a number that is simply wrong by a small percentage. The CRAVEzero Excel workbook has ~3000 formula cells, and even the prior audit documented 35+ formulas — each must be independently verified.

**How to avoid:**
- Build a "golden dataset" from the Excel workbook: extract input values and expected output values for every formula, for at least 3 scenarios (low/medium/high input values).
- Every engine formula function must have a unit test that compares against the golden dataset values within tolerance.
- Run the golden dataset tests in CI. Any formula change that breaks a golden test requires explicit review.
- Use formula IDs (FIN-001, NRG-001, etc.) as test identifiers so audit trail is traceable.
- Implement the golden dataset BEFORE implementing the formulas (test-driven development for the engine).

**Warning signs:**
- Engine tests exist but only test "happy path" with one set of values.
- No tests compare against actual Excel cell values.
- Developer says "I checked it manually" instead of pointing to an automated test.
- Total LCC matches Excel but individual cost components do not (errors cancel out).

**Phase to address:**
Engine core implementation. The golden dataset must be created from Excel as a prerequisite before any formula implementation begins.

---

### Pitfall 7: EN 15459 lookup table data integrity errors

**What goes wrong:**
The EN 15459 lookup table contains 80+ HVAC components with lifespan, annual maintenance percentage, and other data. When transcribing this into code or database seed data, typos in numeric values (e.g., 20 years entered as 2 years, 2.5% entered as 25%) silently corrupt all maintenance calculations for that component type. Unlike a formula bug (which affects all components uniformly), a data entry error affects only specific component types and may go undetected for months.

**Why it happens:**
The lookup table is large, the data is manually transcribed from a standards document or Excel, and there is no structural validation (a lifespan of "2" for a boiler is syntactically valid but factually wrong). Percentage values are especially prone to errors: is it 0.025 (2.5%) or 2.5 (250%)? The project stores rates as decimals internally (DEC-009) but the source data may express them differently.

**How to avoid:**
- Extract the lookup table from the Excel workbook programmatically (not manually). Compare the extracted data against the EN 15459 standard document.
- Add data validation constraints: lifespan must be in [5, 50] years, maintenance % must be in [0.001, 0.10].
- Create a checksum test: sum of all lifespans, sum of all maintenance percentages — must match expected totals.
- Include source reference (EN 15459 table/row number) for each lookup entry for traceability.
- Store percentages consistently: always as decimal (0.025), never as percentage (2.5). Validate on input.

**Warning signs:**
- A single component type has dramatically different maintenance cost from Excel while others match.
- Lookup table values don't match the EN 15459 standard document.
- Total maintenance cost is off by an order of magnitude for projects using a specific HVAC component.

**Phase to address:**
Data modeling / seed data phase. The lookup table must be validated before the maintenance engine module is implemented.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding formula mode to `excel_bugfixed` only | Simpler engine, no branching logic | Cannot reproduce original Excel behavior for validation; users who compared against Excel see different numbers | Never — DEC-002 requires both modes from the start |
| Merging shared and variant params into one object | Faster to implement initial CRUD | Desync bugs, 3x redundant data, complex update logic | Never — data model must enforce the separation |
| Skipping golden dataset and testing formulas "by inspection" | Faster initial development | Formula bugs discovered late, expensive to fix, erode trust in the tool | Never — the entire value proposition is formula accuracy |
| Using `toFixed(2)` for rounding everywhere | Simple, consistent | Banker's rounding not applied, half-cent errors accumulate, inconsistent with Excel | Only for display; use `Math.round(x * 100) / 100` or explicit rounding mode for calculations |
| Storing interest rates as percentages in the database | Matches UI display | Every formula must divide by 100, easy to forget, mixing stored vs display format | Never — DEC-009 requires storing as decimal |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Prisma Decimal to JS number | Calling `.toNumber()` on Decimal without understanding precision loss | Use `.toNumber()` only at the engine boundary; round before storing back; never compare Decimal with `===` to number |
| Excel export (result snapshot) | Generating Excel formulas dynamically | Export static values only (snapshot of calculated results), not formulas. Include engine version and formula mode in metadata |
| PDF export with charts | Rendering Recharts on the server for PDF | Use a headless browser or canvas-based rendering; Recharts is client-side only. Alternatively, export chart data as tables for PDF |
| Auth.js session with tRPC | Assuming session is always available in tRPC context | Handle unauthenticated context explicitly in every tRPC procedure; don't assume middleware always runs |
| Autosave with debounce | Saving after every keystroke triggers recalculation | Debounce saves (300-500ms), but recalculate only on explicit trigger or after save completes, not on every input change |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all 3 variants on every input change | UI freezes for 200-500ms after each keystroke | Recalculate only the affected variant; debounce; use Web Workers for engine if needed | Noticeable at any scale, but worse with complex component lists |
| Loading entire EN 15459 lookup table on every page load | Slow initial page load, 80+ rows fetched unnecessarily | Cache in React state or use static import; lookup table is read-only reference data | Noticeable on slow connections |
| Generating 40-year cost evolution chart with 40*5 data points per variant | Chart rendering lag with 600+ data points * 3 variants | Aggregate by 5-year intervals for overview chart; show yearly detail only on zoom/drill-down | Noticeable on mobile devices |
| Storing every autosave as a full project snapshot | Database bloat, slow queries on project history | Store only changed fields (diff-based autosave); full snapshots only on explicit save or export | After 100+ autosaves per project |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing formula mode toggle to non-admin users | Users switch to `excel_replica` (buggy mode) and get wrong results without understanding why | Default to `excel_bugfixed`; hide mode toggle behind admin/developer setting; clearly label `excel_replica` as "for validation only" |
| Not validating numeric inputs at system boundary | User enters negative reference period, interest rate of 500%, or lifespan of 0 years; engine produces NaN or Infinity | Validate all numeric inputs in tRPC procedures: reference period [1, 100], interest rate [0, 0.30], lifespan [1, 100], costs >= 0 |
| Sharing project links without permission checks | Editor/viewer can escalate to owner by manipulating API calls | Enforce permission checks in every tRPC procedure, not just in UI. Row-level security on project access |
| Result snapshot tampering | User modifies exported snapshot to show fraudulent LCC results | Include a hash of inputs + engine version in the snapshot; display "verified" badge only when hash matches recalculated result |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all 21 construction cost categories on one screen | User overwhelmed, abandons data entry halfway | Progressive disclosure: group categories (A=design, B=building, C=services, D=site, E=other), expand on click |
| Displaying interest rates as decimals in input fields | User enters "3" meaning 3%, but system interprets as 300% | Accept percentage input (3.0), display with "%" suffix, convert to decimal (0.03) on save (DEC-009) |
| Not showing intermediate calculation results | User enters all data, sees a final LCC number, has no way to verify if it's correct | Show intermediate totals (energy PV, maintenance PV, construction total) next to each input section so user can sanity-check progressively |
| Variant comparison without highlighting differences | User can't tell which changes caused which cost differences between variants | Highlight cells/values that differ between variants; show delta (absolute and %) next to each variant's total |
| No indication of which formula mode is active | User sees results without knowing if they match Excel (replica) or are corrected (bugfixed) | Show a subtle indicator: "Calculation mode: Standard" or "Calculation mode: Excel-compatible" in the results header |

## "Looks Done But Isn't" Checklist

- [ ] **Engine formulas:** All 35+ formulas implemented, but no golden dataset tests comparing against Excel values — verify every formula has at least 3 test cases from the actual workbook
- [ ] **Maintenance module:** Flat-percentage maintenance for building elements works, but EN 15459 replacement cycle logic is missing or untested at boundaries — verify replacement at Year = lifespan, Year = 2*lifespan, Year = T, and Year 0
- [ ] **Variant comparison:** All 3 variants calculate independently, but shared parameter changes don't propagate — verify changing reference period or interest rate updates all variant results
- [ ] **Formula mode toggle:** `excel_bugfixed` works, but `excel_replica` was never tested because "nobody uses it" — verify both modes have passing test suites; the toggle exists for audit trail validation
- [ ] **Energy cost calculation:** 5 end-use types calculate correctly, but system count is wrong (2 systems for heating/cooling/DHW, 1 for household/PV) — verify system count multiplier is applied correctly per end-use type
- [ ] **Residual value:** Formula implemented per ISO 15686-5, but not tested because Excel has no reference values (METHOD_IMPROVEMENT) — verify against hand-calculated examples from the standard
- [ ] **Income/NPV analysis:** NPV formula implemented, but payback period calculation has off-by-one error or does not handle "never pays back" case — verify payback with income > costs, income < costs, and income = costs scenarios
- [ ] **Interest rate storage:** UI displays percentages, database stores decimals, but the conversion happens inconsistently — verify a round-trip: enter 3.5% in UI, save, reload, verify 3.5% displays and 0.035 is in database
- [ ] **PDF/Excel export:** Export generates a file, but numbers don't match the on-screen values due to rounding at a different stage — verify export values match display values exactly

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Off-by-one discount exponent | MEDIUM | Fix the exponent, rerun all golden dataset tests, verify total LCC change is consistent with expected (1+r) factor shift |
| Mixed nominal/real rates | HIGH | Audit every formula function's rate parameter, fix incorrect usages, rerun all tests. High cost because the error is silent and may have propagated to saved results |
| Replacement cycle boundary error | LOW | Fix the boundary condition, add edge case tests, rerun. Low cost because it only affects specific years |
| Floating-point accumulation | LOW | Define tolerance contract, update tests to use tolerance-based assertions, document. No formula changes needed |
| Variant shared/independent param confusion | HIGH | Requires database schema migration to separate shared from per-variant fields. All CRUD code must be refactored. Existing project data may need manual migration |
| Untested formulas discovered wrong late | HIGH | Build golden dataset retroactively, fix all failing formulas, reverify all saved results. May require notifying users of corrected calculations |
| EN 15459 data entry errors | MEDIUM | Re-extract lookup table programmatically, diff against current data, fix discrepancies, rerun maintenance tests |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Off-by-one discount exponent | Engine core (calculation module) | Golden dataset tests pass for Year 0, 1, 20, 40 |
| Nominal vs real rate mixing | Engine core (formula signatures) | Integration test: change Rint only, verify energy unchanged; change RR only, verify maintenance unchanged |
| Replacement cycle boundaries | Engine core (maintenance module) | Parameterized tests for all EN 15459 lifespan values against 40-year period |
| Floating-point accumulation | Engine core + test infrastructure | Tolerance-based test assertions defined and documented |
| Variant shared/independent params | Database schema design | Schema review: shared fields in `Project`, per-variant fields in `Variant` table |
| Formula audit gap | Engine core (prerequisite: golden dataset) | CI pipeline runs golden dataset tests; coverage report shows all 35+ formula IDs tested |
| EN 15459 data integrity | Data modeling / seed data | Checksum test on lookup table; validation constraints on lifespan and percentage ranges |
| Formula mode toggle untested | Engine core (both modes) | Both `excel_replica` and `excel_bugfixed` have independent test suites that pass |
| Interest rate unit confusion | API boundary validation + UI | Round-trip test: enter percentage, verify decimal storage, verify percentage display |
| Recalculation performance | Engine optimization | Performance test: single variant recalculation completes in < 50ms |

## Sources

- [CRAVEzero LCC Tool](https://www.cravezero.eu/pboard/Downloads/LCCTool.htm) — original Excel workbook methodology
- [CRAVEzero Methodology](https://cravezero.eu/2020/04/30/cravezero-methodology/) — project methodology overview
- [Development of an nZEB LCC Assessment Tool](https://www.mdpi.com/1996-1073/10/1/59) — academic paper on nZEB LCC tool development
- [NIST Building Life Cycle Cost Programs](https://www.nist.gov/services-resources/software/building-life-cycle-cost-programs) — reference LCC software methodology
- [Excel NPV Function Gotchas](https://support.microsoft.com/en-us/office/npv-function-8672cb67-2576-4d07-b67b-ac28acf2a568) — NPV timing assumptions
- [JavaScript Floating-Point Precision](https://www.robinwieruch.de/javascript-rounding-errors/) — IEEE 754 precision pitfalls
- [Financial Precision in JavaScript](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc) — handling money in JS
- [Decimal.js vs BigNumber.js](https://medium.com/@josephgathumbi/decimal-js-vs-c1471b362181) — precision library comparison
- [Discount Rates in LCC Analysis](https://flh.fhwa.dot.gov/programs/erfo/training/life_cycle_cost_analysis/select_discount_rate.php) — nominal vs real rate methodology
- [The Discount Rate in Life-Cycle Cost Analysis](https://www.rits.rutgers.edu/files/discountrate_lifecycle.pdf) — rate selection pitfalls
- [Worst Financial Services Excel Errors](https://www.qashqade.com/insights/the-worst-financial-services-excel-errors-of-all-time) — historical Excel error case studies
- [Excel Financial Model Testing Strategy](https://lumenbusiness.co.nz/excel-financial-model-testing-strategy/) — validation approaches for Excel migrations
- [EN 15459-1:2017](https://standards.globalspec.com/std/10219361/en-15459-1) — European standard for economic evaluation of energy systems in buildings

---
*Pitfalls research for: nZEB Life-Cycle Cost calculator (Excel-to-web migration)*
*Researched: 2026-03-26*

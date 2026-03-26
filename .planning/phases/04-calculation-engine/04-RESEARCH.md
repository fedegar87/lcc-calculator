# Phase 4: Calculation Engine - Research

**Researched:** 2026-03-26
**Domain:** Pure TypeScript LCC/WLC calculation engine
**Confidence:** HIGH

## Summary

Phase 4 implements the pure calculation engine in `src/engine/` that produces correct LCC/WLC results for any valid `VariantInput`. The engine is a set of pure functions with no DB or framework dependencies, organized into 6 calculation modules plus an orchestrator. All interfaces, types, constants, and validation already exist from Phase 3 -- this phase fills in the calculation logic.

The engine must support two formula modes: `excel_replica` (replicates all Excel bugs for verification) and `excel_bugfixed` (corrects known bugs). Four bugs are documented (MNT-BUG-001, NRG-BUG-001, NRG-BUG-002, MNT-BUG-002), and the engine includes two METHOD_IMPROVEMENT features not in the original Excel (residual value, income analysis).

**Primary recommendation:** Implement modules in strict dependency order (discount -> energy -> maintenance -> residual -> income -> aggregate -> orchestrator). Each module is a small, focused file that exports pure functions. No tests in this phase -- Phase 5 handles testing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module Order (from implementation plan TASK 4)**
Implement in dependency order:
1. `discount.ts` -- FIN-001, FIN-002
2. `energy.ts` -- NRG-001 through NRG-007
3. `maintenance.ts` -- MNT-001 through MNT-004, MNT-BUG-001, CAL-005..008
4. `residual.ts` -- RES-001 (METHOD_IMPROVEMENT)
5. `income.ts` -- INC-001 through INC-003 (METHOD_IMPROVEMENT)
6. `aggregate.ts` -- AGG-001 through AGG-014, CAL-001..004
7. `index.ts` -- orchestrator calling all modules

**Formula Specifications** -- All formulas are locked with exact mathematical definitions in CONTEXT.md (FIN-001/002, NRG-001..007, MNT-001..004, MNT-BUG-001, CAL-001..008, AGG-001..014, RES-001, INC-001..003).

**Implementation Rules (10 locked rules):**
1. Maintenance uses Rint (nominal rate), NOT RR. Energy uses RR. Do not normalize.
2. Building service replacement: `year % lifespan === 0 && replacementCount < maxReplacementCycles`
3. MNT-BUG-001: Two code paths based on formulaMode
4. Energy system counts: Heating/Cooling/DHW=2, Household=1, PV=1(subtracted)
5. PV is subtracted from energy consumed
6. Discount factors: year 0 = 1.0, operational costs start year 1
7. KPIs: null for zero denominators, not Infinity/NaN
8. No rounding in intermediate calculations. Round at output boundary only (2dp EUR, 4dp rates)
9. Site management is SEPARATE from design in LCC formula
10. Engine receives pre-aggregated costs (detail logic in tRPC layer)

### Claude's Discretion
- Internal helper functions within modules
- Error handling strategy (throw vs return errors)
- Whether to create additional utility types for internal use
- Code organization within each module file
- Whether to use early returns or guard clauses
- Exact rounding implementation at output boundary

### Deferred Ideas (OUT OF SCOPE)
- Engine tests with golden fixture (Phase 5)
- Database seed (Phase 6)
- tRPC calculate router (Phase 7)
- Any UI or API concerns
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CALC-01 | Real interest rate via simplified Fisher formula (FIN-001) | `discount.ts`: `RR = (Rint - Rinf) / (1 + Rinf)`. Excel stores rates as decimals. Verified formula: `=(D121-D123)/(1+(D123/100))` but Excel has basis-point quirk -- engine receives pure decimals per DEC-009. |
| CALC-02 | Discount factors array for reference period (FIN-002) | `discount.ts`: `df[0] = 1.0, df[year] = 1 / (1 + RR)^year`. Verified from `Calc!D8 = (1/(1+PI!$D$125))^D7`. Array length = referencePeriod + 1 (years 0..N). |
| CALC-03 | Energy price escalation with compound growth (NRG-001) | `energy.ts`: `price[year] = price[year-1] * (1 + annualIncrease)`. Non-PV uses INDEX lookup; PV uses hard-coded source index 13 (`PI!$G$143`). See PV Special Case finding. |
| CALC-04 | Energy cost for 5 end-use types with correct system counts (NRG-002..007) | `energy.ts`: Heating/Cooling/DHW have 2 systems summed; Household has 1; PV has 1 (subtracted). Nominal = consumption * price[year], actualized = nominal / (1+RR)^year, cumulated = running sum. |
| CALC-05 | Building element maintenance with Rint (MNT-001, MNT-002) | `maintenance.ts`: `cost[year] = totalConstruction * maintenancePercent / (1 + Rint)^year`. Uses Rint NOT RR (DEC-005). Flat percentage across all A* categories. |
| CALC-06 | Building service maintenance with EN 15459 and replacement (MNT-003, MNT-004) | `maintenance.ts`: Per-component, uses EN15459 lookup for lifespan and maintenance %. Replacement at `year % lifespan === 0` up to maxReplacementCycles. Both replacement and annual costs discounted by Rint. |
| CALC-07 | Formula mode toggle for MNT-BUG-001 | `maintenance.ts`: `excel_replica` uses column index (9) as exponent for row 62 (last service component); `excel_bugfixed` uses actual year. See MNT-BUG-001 detailed finding. |
| CALC-08 | Energy aggregation: consumed, produced, cumulated (CAL-001..004) | `aggregate.ts`: CAL-001 sums actualized Heating+Cooling+DHW+Household per year. CAL-002 = PV actualized. CAL-003/004 = running sums of CAL-001/002. |
| CALC-09 | Maintenance aggregation: elements + services (CAL-005..008) | `aggregate.ts`: CAL-005 = elements total at refPeriod, CAL-006 = services total, CAL-007 = sum, CAL-008 = cumulated. Values picked from cumulated arrays at referencePeriod index. |
| CALC-10 | Construction cost aggregation by category (AGG-001..004) | `aggregate.ts`: Sum costItems[].materialCost, laborCost, otherCost. Group by category. totalConstruction = materials + labor + other. |
| CALC-11 | Non-construction, design, site management (AGG-005..007) | `aggregate.ts`: nonConstruction from wlcInput fields. designCosts = wlcInput.designCostsTotal. siteManagement = wlcInput.siteManagementCostsTotal (separate per DEC-010). |
| CALC-12 | O&M = energy consumed - PV + maintenance (AGG-008..011) | `aggregate.ts`: O&M = CAL-001(cumulated at refPeriod) - CAL-002(cumulated at refPeriod) + CAL-007. |
| CALC-13 | LCC = design + construction + O&M + site management (AGG-012) | `aggregate.ts`: 4-term sum. Site management is NOT part of design (DEC-010). |
| CALC-14 | WLC = LCC + non-construction costs (AGG-013) | `aggregate.ts`: Simple addition. |
| CALC-15 | KPI ratios with null-safe division (AGG-014) | `aggregate.ts`: Divisor is "investment cost" (construction + design + site_mgmt), NOT LCC. See KPI Divisor finding. Return null for zero denominators. |
| CALC-16 | Residual value per ISO 15686-5 (RES-001) | `residual.ts`: `cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod`. Only B*/C* categories. Building elements have lifespan = refPeriod so residual = 0. METHOD_IMPROVEMENT. |
| CALC-17 | Income analysis: net income, payback, NPV (INC-001..003) | `income.ts`: netAnnualIncome from rents and otherIncomes. simplePayback = LCC / netAnnualIncome (null if 0). NPV = sum of discounted income. METHOD_IMPROVEMENT. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (strict) | Language | Already configured in project |
| Vitest | 3.x | Test runner (Phase 5) | Already configured in `vitest.config.ts` |

### Supporting
No additional libraries needed. The calculation engine is pure TypeScript math -- no dependencies beyond what Phase 3 already provides (types, constants, validation).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain number | Decimal.js / big.js | Overkill for building LCC precision. DEC-001 explicitly chose IEEE 754 with boundary rounding. |
| Hand-rolled formulas | Financial library (e.g., financial.js) | Our formulas are specific to EN 15459/ISO 15686-5 -- no library covers this domain. |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/engine/
├── types.ts          # EXISTS: VariantInput, LCCResult, FormulaMode, etc.
├── constants.ts      # EXISTS: EN15459_COMPONENTS, ENERGY_SOURCES
├── validation.ts     # EXISTS: validateVariantInput()
├── discount.ts       # NEW: computeRealInterestRate(), computeDiscountFactors()
├── energy.ts         # NEW: computeEnergyCosts()
├── maintenance.ts    # NEW: computeMaintenanceCosts()
├── residual.ts       # NEW: computeResidualValue()
├── income.ts         # NEW: computeIncome()
├── aggregate.ts      # NEW: aggregateResults()
├── index.ts          # NEW: calculateLCC() orchestrator
└── __tests__/
    └── validation.test.ts  # EXISTS (Phase 5 adds more)
```

### Pattern 1: Pure Module Function
**What:** Each module exports one primary function that takes specific inputs and returns specific outputs. No side effects, no state, no I/O.
**When to use:** Every calculation module.
**Example:**
```typescript
// discount.ts
export function computeRealInterestRate(
  nominalRate: number,
  inflationRate: number,
): number {
  // FIN-001: Simplified Fisher formula
  return (nominalRate - inflationRate) / (1 + inflationRate);
}

export function computeDiscountFactors(
  realRate: number,
  referencePeriod: number,
): number[] {
  // FIN-002: df[0] = 1.0, df[year] = 1 / (1 + RR)^year
  const factors: number[] = new Array(referencePeriod + 1);
  factors[0] = 1.0;
  for (let year = 1; year <= referencePeriod; year++) {
    factors[year] = 1 / Math.pow(1 + realRate, year);
  }
  return factors;
}
```

### Pattern 2: Formula Mode Branching
**What:** When a calculation has buggy vs corrected behavior, use a simple if/else on `formulaMode` with inline comments referencing the bug ID.
**When to use:** MNT-BUG-001 (and potentially NRG-BUG-001/002, MNT-BUG-002 if handling per-variant bugs).
**Example:**
```typescript
// maintenance.ts - inside service component loop
if (isReplacementYear) {
  if (config.formulaMode === 'excel_replica' && isLastServiceComponent) {
    // MNT-BUG-001: Excel uses column index (9) instead of year
    discountExponent = 9; // Column I = 9
  } else {
    discountExponent = year;
  }
  cost = constructionCost / Math.pow(1 + nominalRate, discountExponent);
}
```

### Pattern 3: Orchestrator Assembly
**What:** The `index.ts` calls each module in order, passing outputs from earlier modules as inputs to later ones, then assembles the final `LCCResult`.
**When to use:** The main `calculateLCC()` function.
**Example:**
```typescript
// index.ts
export function calculateLCC(
  input: VariantInput,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): LCCResult {
  // 1. Validate
  const errors = validateVariantInput(input);
  if (errors.length > 0) throw new Error(`Invalid input: ${errors.join(', ')}`);

  // 2. Discount (FIN-001, FIN-002)
  const rr = computeRealInterestRate(input.interestRate, input.inflationRate);
  const df = computeDiscountFactors(rr, input.referencePeriod);

  // 3. Energy (NRG-001..007)
  const energy = computeEnergyCosts(input, rr, input.referencePeriod);

  // 4. Maintenance (MNT-001..004)
  const maintenance = computeMaintenanceCosts(input, config);

  // 5. Aggregation (AGG-001..014, CAL-001..008)
  // ... etc.

  return { /* assembled LCCResult */ };
}
```

### Anti-Patterns to Avoid
- **Premature rounding:** Do NOT round intermediate values. Only round at the output boundary in `index.ts` after all calculations complete.
- **Rate confusion:** Do NOT pass RR where Rint is needed or vice versa. Maintenance uses Rint (nominal). Energy uses RR (real). Both are different numbers.
- **Array length mismatch:** All yearly arrays must have length `referencePeriod + 1` (years 0 through N). Year 0 always exists with value 0 for operational costs and 1.0 for discount factor.
- **NaN/Infinity propagation:** Never return NaN or Infinity. KPIs with zero denominator return null. Guard all divisions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EN 15459 lookup | Manual lifespan/maintenance tables | `getEN15459Component()` from `constants.ts` | Already extracted and typed from audit |
| Energy source lookup | Inline price tables | `ENERGY_SOURCES` from `constants.ts` | Already extracted from audit |
| Category -> maintenance type mapping | Runtime inference | `CATEGORY_MAINTENANCE_MAP` from `types.ts` | Already defined as constant |
| Input validation | Inline checks in calculation code | `validateVariantInput()` from `validation.ts` | Already implemented and tested |

**Key insight:** Phase 3 built all the infrastructure. Phase 4 only adds calculation logic -- do not duplicate any lookup, validation, or type definition.

## Common Pitfalls

### Pitfall 1: MNT-BUG-001 Misimplementation
**What goes wrong:** The bug is subtle -- in `excel_replica` mode, row 62 (the last building service component, index 26) uses a column reference `(I)` as the exponent instead of the year value `(I5)`. Column I = 9, so the exponent is always 9 regardless of year.
**Why it happens:** The bug only affects one specific row (62, the last service component). All other rows (37-61) correctly use `^(I5)`. Easy to miss the distinction or apply it too broadly.
**How to avoid:** The engine identifies the "last service component" by position, not by row number. In `excel_replica` mode, when the component is the last one in the array, replacement cost uses a fixed exponent of 9 instead of the actual year.
**Warning signs:** If `excel_replica` and `excel_bugfixed` produce identical results for the last service component -- the bug isn't being replicated.

### Pitfall 2: PV Price Escalation Special Case
**What goes wrong:** PV price escalation uses a hard-coded energy source (index 13, "Electricity from Photovoltaics", `PI!$G$143`) instead of the dynamic INDEX lookup mechanism used by all other energy types.
**Why it happens:** The Excel formula for PV row 28 is `=D28+PI!$G$143*D28`, not `=D28+(INDEX(PI!$G$131:$G$149, PI!$D$170)*D28)` like other types.
**How to avoid:** The engine must special-case PV: always use the annual increase rate from energy source index 13 in the `energyPrices` array, regardless of what the PV endUse's `energySourceIndex` points to. Or, the tRPC layer ensures PV always maps to source 13.
**Warning signs:** PV costs escalating at a different rate than expected.

### Pitfall 3: KPI Divisor Is Investment Cost, Not LCC
**What goes wrong:** The implementation plan says "AGG-014: component / LCC" but the actual Excel formula divides by B63 (investment cost = construction + design + site management), NOT B62 (LCC which also includes O&M).
**Why it happens:** B63 and B62 differ by the O&M component. Using LCC as divisor would make the KPIs sum to less than 100%.
**How to avoid:** The engine computes `investmentCost = totalConstruction + designCosts + siteManagement` as a separate intermediate value, then uses it as the KPI divisor. Verified from raw formula: `B82 = (B58+B59+B60)/B63`, `B83 = B66/B63`, `B84 = B71/B63`, `B85 = B76/B63`.
**Warning signs:** KPI ratios don't sum to approximately 100% (they won't exactly because O&M is a separate ratio).

### Pitfall 4: Cumulated Array Year 0 Initialization
**What goes wrong:** Cumulated energy or maintenance arrays start with wrong value at year 0 or year 1.
**Why it happens:** Excel has an inconsistency: Heating cumulated at year 1 = `E12` (just year 1 value), Cooling cumulated at year 1 = `D18+E17` (year 0 + year 1). Since year 0 operational costs are 0, both produce the same result.
**How to avoid:** Engine uses consistent logic: `cumulated[0] = 0`, `cumulated[year] = cumulated[year-1] + actualized[year]` for year 1..N.
**Warning signs:** Off-by-one in cumulated arrays; year 0 being non-zero for operational costs.

### Pitfall 5: Replacement Count vs Modulo
**What goes wrong:** Using `year === lifespan || year === lifespan*2 || year === lifespan*3` (Excel approach) works only for 3 replacements. Using pure `year % lifespan === 0` without a counter allows unlimited replacements.
**Why it happens:** The Excel formula hard-codes 3 checks: `IF(OR(I5=$H$37, I5=($H$37*2), I5=($H$37*3)), ...)`.
**How to avoid:** Use `year % lifespan === 0` with a counter: `if (year > 0 && lifespan > 0 && year % lifespan === 0 && replacementsUsed < config.maxReplacementCycles)`. Default `maxReplacementCycles = 3` matches Excel.
**Warning signs:** Service components getting replaced more than 3 times in long reference periods (>3x lifespan).

### Pitfall 6: NRG-BUG-001/002 and MNT-BUG-002 Scope
**What goes wrong:** These bugs are about incorrect cross-references (Household uses DHW's source index; V2 uses V1's prices/maintenance). Since the engine calculates one variant at a time with pre-aggregated inputs, these bugs are actually invisible to the engine -- they're data-entry bugs that would be replicated by passing wrong inputs.
**Why it happens:** The bugs are in the Excel cell references, not in the formula logic. The engine receives `energyPrices` and `energyInputs` as parameters -- if the tRPC layer passes correct data, the bugs don't exist.
**How to avoid:** Document that NRG-BUG-001, NRG-BUG-002, and MNT-BUG-002 are handled at the tRPC/data layer, not in the engine. Only MNT-BUG-001 requires engine-level formula mode branching.
**Warning signs:** Trying to add `formulaMode` checks for bugs that aren't formula-level issues.

## Code Examples

### Real Interest Rate (FIN-001)
```typescript
// Verified from PI!D125 = (D121-D123)/(1+(D123/100))
// Engine receives rates as decimals (e.g., 0.0151), not basis points
export function computeRealInterestRate(
  nominalRate: number,   // e.g., 0.0151
  inflationRate: number, // e.g., 0.0056
): number {
  return (nominalRate - inflationRate) / (1 + inflationRate);
}
```

### Energy Price Escalation with PV Special Case (NRG-001)
```typescript
// For non-PV: price[year] = price[year-1] * (1 + annualIncrease)
//   annualIncrease from INDEX(G131:G149, energySourceIndex)
// For PV: always uses source index 13 ("Electricity from Photovoltaics")
//   Verified from Calc!E28 = D28 + PI!$G$143 * D28
//   G143 = row 143 = source index 13

function escalatePrice(
  initialPrice: number,
  annualIncrease: number,
  referencePeriod: number,
): number[] {
  const prices = new Array(referencePeriod + 1);
  prices[0] = initialPrice;
  for (let year = 1; year <= referencePeriod; year++) {
    prices[year] = prices[year - 1] * (1 + annualIncrease);
  }
  return prices;
}
```

### Building Service Maintenance with Bug Toggle (MNT-004 + MNT-BUG-001)
```typescript
// Verified from Maintenance!I37:
//   =IF(OR(I5=$H$37,I5=($H$37*2),I5=($H$37*3)),
//     ($E$37/((1+$D$5)^(I5))),
//     ($G$37/((1+$D$5)^(I5))))
// Row 62 bug: TRUE branch uses ^(I) instead of ^(I5)
//   (I) = column number 9

function computeServiceComponentYear(
  year: number,
  constructionCost: number,
  annualMaintenanceCost: number,
  lifespan: number,
  nominalRate: number,
  replacementsUsed: number,
  maxReplacements: number,
  isLastComponent: boolean,
  formulaMode: FormulaMode,
): { cost: number; replacement: boolean } {
  const isReplacementYear =
    year > 0 &&
    lifespan > 0 &&
    year % lifespan === 0 &&
    replacementsUsed < maxReplacements;

  let exponent = year;
  if (isReplacementYear && isLastComponent && formulaMode === 'excel_replica') {
    // MNT-BUG-001: Column I reference = 9
    exponent = 9;
  }

  const baseCost = isReplacementYear ? constructionCost : annualMaintenanceCost;
  const cost = baseCost / Math.pow(1 + nominalRate, exponent);

  return { cost, replacement: isReplacementYear };
}
```

### Residual Value (RES-001)
```typescript
// ISO 15686-5 formula (METHOD_IMPROVEMENT -- not in Excel)
// Applied only to building services (B*/C* categories)
function computeComponentResidual(
  constructionCost: number,
  lifespan: number,
  referencePeriod: number,
  realRate: number,
): number {
  if (lifespan <= 0) return 0;
  const remainingLife = lifespan - (referencePeriod % lifespan);
  const fraction = Math.max(0, remainingLife / lifespan);
  // If referencePeriod is exact multiple of lifespan, fraction = 1.0 (full replacement just done)
  // But that means the component was just replaced, so residual = full cost discounted
  // Actually: if refPeriod % lifespan === 0, remainingLife = lifespan, fraction = 1.0
  return constructionCost * fraction / Math.pow(1 + realRate, referencePeriod);
}
```

### KPI with Null-Safe Division (AGG-014)
```typescript
// Verified: divisor is B63 = B65 + B57 + B61 (investment cost)
// NOT B62 (LCC which includes O&M)
function safeRatio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

// investmentCost = totalConstruction + designCosts + siteManagement
const investmentCost = totalConstruction + designCosts + siteManagement;
const kpiDesignOverLCC = safeRatio(designCosts, investmentCost);
const kpiConstructionOverLCC = safeRatio(totalMaterials, investmentCost);  // B66/B63
const kpiLaborOverLCC = safeRatio(totalLabor, investmentCost);            // B71/B63
const kpiOMOverLCC = safeRatio(operationAndMaintenance, investmentCost);  // B76/B63
```

## Key Findings

### 1. Existing Infrastructure Is Complete
All types (`VariantInput`, `LCCResult`, `YearlyEnergyCosts`), constants (`EN15459_COMPONENTS`, `ENERGY_SOURCES`, `CATEGORY_MAINTENANCE_MAP`), and validation (`validateVariantInput`) are already defined and tested. Phase 4 only needs to implement calculation functions -- no type changes or new dependencies.

**Confidence:** HIGH -- verified by reading `src/engine/types.ts`, `constants.ts`, and `validation.ts`.

### 2. MNT-BUG-001 Is the Only Engine-Level Bug
Of the 4 documented bugs, only MNT-BUG-001 (Maintenance row 62 exponent) requires formula-mode branching in the engine. The other 3 bugs (NRG-BUG-001, NRG-BUG-002, MNT-BUG-002) are cross-reference errors between sheets/variants that manifest at the data layer, not the formula layer. Since the engine receives pre-aggregated inputs per variant, these bugs would only be replicated by passing incorrect input data from the tRPC layer.

**Confidence:** HIGH -- verified from raw formula extraction. `Maintenance!I62` TRUE branch has `^(I)` while all other rows have `^(I5)`. The other bugs are INDEX/reference errors between PI/Calc sheet variant columns.

### 3. PV Uses Fixed Energy Source Index 13
PV price escalation is hard-coded to use `PI!$G$143` (energy source index 13, "Electricity from Photovoltaics") rather than the dynamic INDEX lookup used by other energy types. This is verified from Calc row 28: `E28 = D28 + PI!$G$143 * D28` (all 40 year columns use the same formula). The initial PV price comes from `PI!$E$171`.

**Confidence:** HIGH -- verified from 40+ consecutive cells in `formulas_raw.json` all referencing `$G$143`.

### 4. KPI Divisor Is "Investment Cost", Not LCC
The Excel KPI formulas (B82-B85) divide by B63, which is `B65 + B57 + B61` (construction + design + site management = "investment cost"). This differs from the implementation plan's description of "component / LCC". LCC (B62) additionally includes O&M (B76). Using investment cost as divisor means the first 3 KPIs (design, construction materials, labor) sum to a meaningful ratio, while the O&M KPI shows operational costs relative to initial investment.

**Confidence:** HIGH -- directly verified from `formulas_raw.json`: `B82 = (B58+B59+B60)/B63`, `B83 = B66/B63`, `B84 = B71/B63`, `B85 = B76/B63`, and `B63 = B65+B57+B61`.

### 5. DesignCosts Uses Pre-Aggregated Total
The `VariantInput` has both `designCosts: DesignCostInput[]` (line items) and `wlcInput.designCostsTotal: number` (pre-aggregated total). For AGG-006, the engine should use `wlcInput.designCostsTotal` directly, consistent with rule 10 ("engine receives pre-aggregated costs"). The `DesignCostInput[]` array is for display/reporting purposes, not for engine calculation.

**Confidence:** HIGH -- from types.ts and AGG-006 spec: "designCosts = wlcInput.designCostsTotal".

### 6. Non-Construction Costs Include User Support Fields
AGG-005 (nonConstructionCosts) aggregates: `landCost + enablingCosts + planningFees + userSupportPropMgmt + userSupportCharges + userSupportAdmin + financeCost`. These 7 fields map to `WLCInputData`. The Excel formula `WLC!G27+WLC!J27` sums two column groups that contain these same line items.

**Confidence:** HIGH -- verified from types.ts `WLCInputData` fields and AGG-005 formula.

### 7. LCCResult Field Naming Discrepancy for KPIs
The `LCCResult` interface names KPIs as `kpiDesignOverLCC`, `kpiConstructionOverLCC`, etc. -- but the actual divisor is investment cost, not LCC. This naming is slightly misleading but is already locked in from Phase 3. The planner should add a comment in the code clarifying the actual divisor.

**Confidence:** HIGH -- from types.ts lines 194-199.

### 8. Rounding Strategy at Output Boundary
Rule 8 says "round at output boundary only (2dp EUR, 4dp rates)". The orchestrator in `index.ts` should apply rounding as the last step before returning `LCCResult`. A helper like `roundCurrency(v: number): number => Math.round(v * 100) / 100` and `roundRate(v: number): number => Math.round(v * 10000) / 10000` would keep this clean.

**Confidence:** HIGH -- from DEC-001 and implementation rule 8.

## Open Questions

1. **MNT-BUG-001 Column Index Value**
   - What we know: In Excel, `(I)` in a formula is interpreted as a reference to column I, which has column number 9. This value is constant regardless of which year column the formula is in.
   - What's unclear: The J62 formula also has `^(I)` not `^(J)` -- confirmed from raw data: `J62 = IF(..., ($E$62/((1+$D$5)^(I))), ...)`. So the bug always uses column 9, not the current column. This means for ALL years the replacement exponent is 9, not just year 1.
   - Recommendation: In `excel_replica` mode, last service component replacement always uses exponent = 9. This is confirmed.

2. **Should NRG-BUG-001/002 and MNT-BUG-002 be replicated in engine?**
   - What we know: These bugs are cross-reference errors (wrong variant column, wrong source index). The engine processes one variant at a time with explicit inputs.
   - What's unclear: Whether `excel_replica` mode should also reproduce these bugs. Since they're data-layer issues, the tRPC layer in Phase 7 would need to intentionally pass wrong data.
   - Recommendation: Document in engine code that these bugs exist but are outside engine scope. Handle in Phase 7 tRPC layer if `excel_replica` fidelity is needed. For Phase 4, only MNT-BUG-001 needs engine-level handling.

3. **Residual value when refPeriod % lifespan === 0**
   - What we know: When `refPeriod % lifespan === 0`, the formula gives `remainingLife = lifespan`, `fraction = 1.0`, meaning full construction cost is counted as residual.
   - What's unclear: Is this economically correct? If a component was just replaced at exactly `refPeriod`, it has full remaining life, so yes -- the residual should be the full discounted cost.
   - Recommendation: Implement as-is. The formula is correct per ISO 15686-5. A component replaced at the end of the period has its full value remaining.

## Sources

### Primary (HIGH confidence)
- `src/engine/types.ts` -- all input/output interfaces verified
- `src/engine/constants.ts` -- EN 15459 components and energy sources
- `src/engine/validation.ts` -- input validation rules
- `docs/formula-map.md` -- 39 formula IDs with verified cell references
- `docs/architecture-decisions.md` -- DEC-001 through DEC-010
- `scripts/output/formulas_raw.json` -- 23,668 extracted formula cells for cross-reference

### Secondary (MEDIUM confidence)
- `.planning/phases/04-calculation-engine/04-CONTEXT.md` -- user decisions and implementation rules

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure TypeScript math
- Architecture: HIGH -- module structure and interfaces already defined from Phase 3
- Formulas: HIGH -- all formulas verified against raw Excel extraction
- Pitfalls: HIGH -- bugs verified from actual cell formulas, KPI divisor confirmed
- Edge cases: MEDIUM -- some edge cases (zero lifespan, empty arrays) need implementation-time handling

**Research date:** 2026-03-26
**Valid until:** Indefinite (formulas don't change; engine types are locked from Phase 3)

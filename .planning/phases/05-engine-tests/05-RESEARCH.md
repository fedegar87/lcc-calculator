# Phase 5: Engine Tests - Research

**Researched:** 2026-03-26
**Domain:** Vitest unit/integration testing for a pure TypeScript calculation engine
**Confidence:** HIGH

## Summary

Phase 5 validates the LCC calculation engine (built in Phase 4) against a golden dataset extracted from the CRAVEzero Excel workbook. The engine is pure TypeScript with no external dependencies beyond EN 15459 constants -- testing requires only Vitest (already configured at v4.1.1) and a hand-crafted golden fixture JSON.

The critical finding is that `scripts/output/formulas_raw.json` contains 23,668 formulas but nearly all cached values are 0 because the workbook was extracted in an empty state. The only non-zero cached values are computed fields (RR = 0.00949..., Rint = 0.0151, Ri = 0.0056). This means the golden fixture cannot be auto-generated from the extracted data -- it must be manually constructed using known input values and hand-calculated expected outputs, verified against the formulas documented in `docs/formula-map.md`.

The engine has 7 modules (discount, energy, maintenance, residual, income, aggregate, orchestrator) with well-defined interfaces. Each module's functions are exported and can be tested in isolation. The `calculateLCC()` orchestrator produces a fully rounded `LCCResult` object. Vitest 4.1.1 provides `toBeCloseTo(value, numDigits)` for floating-point tolerance and `test.each` for parametric tests -- both are essential for this phase.

**Primary recommendation:** Build the golden fixture manually using realistic input values (Rint=1.51%, Ri=0.56%, 40-year period, 1750m2 TFA -- matching the seed data plan from TASK 6). Compute expected intermediate and final values by following each formula ID step-by-step. Use `toBeCloseTo` with `numDigits=2` for currency (0.01 EUR tolerance) and `numDigits=4` for rates.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Golden fixture from Excel workbook or pre-extracted data, saved to `tests/fixtures/excel-reference.json`
- Fixture contains BOTH the input (VariantInput) and expected output (LCCResult-like structure)
- Use Base variant (column D-K in Excel) as golden reference
- One test file per module: `tests/engine/discount.test.ts`, `tests/engine/energy.test.ts`, `tests/engine/maintenance.test.ts`, `tests/engine/aggregate.test.ts`, `tests/engine/residual.test.ts`, `tests/engine/income.test.ts`
- Tolerance: +/- 0.01 EUR for intermediate values, exact match (after rounding to 2 decimals) for final totals
- Integration test in `tests/engine/integration.test.ts`: full golden fixture input into `calculateLCC()`
- Formula mode test: `excel_replica` produces buggy value for MNT-BUG-001, `excel_bugfixed` produces corrected value; the two must differ
- Edge cases: `treatedFloorArea=0` (KPIs null), `referencePeriod=1`, no energy inputs, no service components, no income data, all-zero costs
- Vitest already configured (Phase 1)
- Residual and income modules are METHOD_IMPROVEMENT -- hand-calculated expected values only
- Existing `src/engine/__tests__/validation.test.ts` has 17 passing tests (from Phase 3)

### Claude's Discretion
- How to structure the golden fixture JSON (flat vs nested)
- Whether to create a shared test helper for tolerance checking
- How to extract golden values (manually from Excel vs programmatically from formulas_raw.json)
- Whether to use `describe`/`it` nesting or flat test structure
- Exact hand-calculated values for residual and income tests
- Whether to move the existing validation tests to tests/engine/ for consistency

### Deferred Ideas (OUT OF SCOPE)
- Performance benchmarks (not needed for correctness)
- Property-based / fuzz testing (nice-to-have for v2)
- Snapshot tests for LCCResult structure (brittle, avoid)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Golden fixture extracted from Excel with all intermediate and final values | Golden fixture must be manually constructed since formulas_raw.json cached values are mostly 0. Use formula-map.md cell references with realistic input values. Structure as `{ input: VariantInput, expected: { intermediate: {...}, final: LCCResult-like } }` |
| TEST-02 | Unit tests per module (discount, energy, maintenance, aggregate, residual, income) | One test file per module in `tests/engine/`. Use `toBeCloseTo(value, 2)` for currency, `toBeCloseTo(value, 4)` for rates. Use `test.each` for parametric coverage across formula IDs |
| TEST-03 | Integration test validates full calculateLCC() against golden fixture | Feed golden fixture input into `calculateLCC()`, compare every field of LCCResult. Final totals use exact match after rounding (2dp). Time series arrays compared element-by-element |
| TEST-04 | Formula mode test: excel_replica produces buggy value, excel_bugfixed produces corrected | MNT-BUG-001: last service component uses exponent 9 in excel_replica mode. Need fixture with service component at en15459ComponentIndex with lifespan that creates a replacement year. Verify the two results differ |
| TEST-05 | Edge cases: zero area, min period, no energy, no services, no income, all-zero costs | Six edge case scenarios. Each modifies the base input minimally. Test that engine doesn't crash and produces expected null/zero outputs |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.1 | Test runner and assertion library | Already installed and configured in Phase 1. Vite-native, TypeScript-first |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | -- | -- | Engine is pure TypeScript; no mocks, no DOM, no database required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest `toBeCloseTo` | Custom tolerance helper | `toBeCloseTo` is built-in and standard; custom helper only if asymmetric matchers needed for deep object comparison |
| Hand-calculated fixture | ExcelJS to read workbook | Workbook is empty (all 0s); ExcelJS would return 0 for all values. Not useful |

**Installation:**
No additional packages needed. Vitest 4.1.1 already installed.

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── fixtures/
│   └── excel-reference.json      # Golden fixture: input + expected output
├── engine/
│   ├── helpers.ts                 # Shared tolerance helpers and input builders
│   ├── discount.test.ts           # FIN-001, FIN-002
│   ├── energy.test.ts             # NRG-001..007
│   ├── maintenance.test.ts        # MNT-001..004, MNT-BUG-001
│   ├── aggregate.test.ts          # AGG-001..014, CAL-001..008
│   ├── residual.test.ts           # RES-001 (hand-calculated)
│   ├── income.test.ts             # INC-001..003 (hand-calculated)
│   ├── integration.test.ts        # Full calculateLCC() end-to-end
│   └── edge-cases.test.ts         # Zero area, min period, empty inputs
└── smoke.test.ts                  # (already exists)
```

### Pattern 1: Golden Fixture Structure
**What:** A single JSON file containing both the engine input and all expected output values at intermediate and final levels.
**When to use:** When validating a complex calculation pipeline against a known reference.
**Example:**
```typescript
// tests/fixtures/excel-reference.json structure
{
  "meta": {
    "description": "Base variant reference from CRAVEzero workbook formulas",
    "referencePeriod": 40,
    "formulaMode": "excel_bugfixed"
  },
  "input": {
    // Full VariantInput matching the engine interface
    "referencePeriod": 40,
    "interestRate": 0.0151,
    "inflationRate": 0.0056,
    "treatedFloorArea": 1750,
    "energyPrices": [ /* ... */ ],
    "energyInputs": [ /* ... */ ],
    "costItems": [ /* ... */ ],
    "serviceComponents": [ /* ... */ ],
    "buildingElementMaintenancePercent": 0.01,
    "wlcInput": { /* ... */ },
    "designCosts": [ /* ... */ ],
    "incomeInput": { /* ... */ }
  },
  "expected": {
    "realInterestRate": 0.0094,
    "discountFactors": { "year1": 0.9906, "year10": 0.9103, "year40": 0.6858 },
    "energy": {
      "heating": { "nominalYear1": 1234.56, "actualizedYear1": 1222.89, "cumulatedYear40": 45678.90 },
      // ... per end-use
    },
    "maintenance": {
      "elementsYear1": 123.45,
      "servicesCumulatedYear40": 6789.01,
      // ...
    },
    "aggregate": {
      "totalMaterials": 50000, "totalLabor": 30000, "totalConstruction": 80000,
      "nonConstructionCosts": 111700, "designCosts": 10000, "buildingSiteManagement": 5000,
      "energyConsumed": 45000, "energyProduced": 12000, "maintenanceAtRefPeriod": 15000,
      "operationAndMaintenance": 48000,
      "lcc": 143000, "wlc": 254700
    },
    "kpis": {
      "designOverLCC": 0.1052, "constructionOverLCC": 0.5263,
      "laborOverLCC": 0.3157, "omOverLCC": 0.5052,
      "lccPerM2": 81.71, "wlcPerM2": 145.54
    }
  }
}
```

### Pattern 2: Tolerance-Based Assertions
**What:** Use `toBeCloseTo` for floating-point comparison with explicit precision.
**When to use:** All numeric comparisons in engine tests.
**Example:**
```typescript
// Source: https://vitest.dev/api/expect.html#tobecloseto
// Currency: 2 decimal places (0.01 EUR tolerance)
expect(result.lcc).toBeCloseTo(143000.00, 2);

// Rates: 4 decimal places
expect(result.realInterestRate).toBeCloseTo(0.0094, 4);

// Array element-by-element comparison
result.heatingCosts.nominal.forEach((val, i) => {
  expect(val).toBeCloseTo(expected.heating.nominal[i], 2);
});
```

### Pattern 3: Parametric Tests with test.each
**What:** Use `test.each` to run the same assertion across multiple formula IDs or years.
**When to use:** Testing yearly time series, multiple energy end-uses, or multiple categories.
**Example:**
```typescript
// Source: https://vitest.dev/api/#test-each
describe('NRG - Energy cost formulas', () => {
  test.each([
    { endUse: 'heating', year: 1, expectedNominal: 1234.56 },
    { endUse: 'heating', year: 10, expectedNominal: 1567.89 },
    { endUse: 'heating', year: 40, expectedNominal: 2345.67 },
  ])('$endUse nominal cost at year $year', ({ endUse, year, expectedNominal }) => {
    expect(result[`${endUse}Costs`].nominal[year]).toBeCloseTo(expectedNominal, 2);
  });
});
```

### Pattern 4: Shared Input Builder
**What:** A helper function that returns a valid base VariantInput, with overridable properties for edge cases.
**When to use:** Edge case tests where only one property differs from the base case.
**Example:**
```typescript
// tests/engine/helpers.ts
import goldenFixture from '../fixtures/excel-reference.json';
import type { VariantInput } from '@/engine/types';

export function baseInput(): VariantInput {
  return structuredClone(goldenFixture.input) as VariantInput;
}

export function inputWith(overrides: Partial<VariantInput>): VariantInput {
  return { ...baseInput(), ...overrides };
}
```

### Anti-Patterns to Avoid
- **Snapshot testing for numeric results:** Snapshots break on any rounding change and provide no tolerance. Use explicit `toBeCloseTo` assertions.
- **Testing every single year in time series:** For a 40-year period, spot-check years 1, 10, 20, 40 rather than all 41 values (except in integration test).
- **Mocking engine internals:** Engine modules are pure functions. Test them directly with real inputs; mocking defeats the purpose of correctness validation.
- **Sharing mutable state between tests:** Use `structuredClone(goldenFixture.input)` or a factory function to ensure test isolation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Floating-point comparison | Custom `almostEqual()` | Vitest `toBeCloseTo(value, numDigits)` | Built-in, standard, understood by all contributors |
| Parametric test execution | Manual loops with dynamic `it()` calls | `test.each([...])` | Proper test names, isolation, failure reporting |
| Deep object comparison with tolerance | Recursive custom matcher | Break into field-by-field assertions with `toBeCloseTo` | Debugging is clearer when specific fields fail |
| Golden fixture loading | Dynamic file reads in test | Direct JSON import (Vitest resolves JSON via Vite) | Static analysis, type safety, fast |

**Key insight:** Vitest provides all the assertion primitives needed. The only custom code should be a thin `helpers.ts` with input factory functions and possibly a `expectCurrency(actual, expected)` wrapper that calls `toBeCloseTo(expected, 2)`.

## Common Pitfalls

### Pitfall 1: Golden Fixture Values Are Wrong
**What goes wrong:** Hand-calculated expected values have arithmetic errors, causing tests to fail even though the engine is correct.
**Why it happens:** Manually computing 40-year time series with compound growth and discounting is error-prone.
**How to avoid:**
1. Compute step-by-step: first verify RR from Rint and Ri, then discount factors, then one energy source price escalation, then one year's cost.
2. Cross-check intermediate values: if energy consumed + maintenance + production doesn't sum to O&M, something is wrong.
3. Start with a simplified fixture (e.g., referencePeriod=5, single energy source, single cost item) to validate formulas, then expand.
**Warning signs:** Tests fail with small but consistent offsets; expected values don't satisfy the identity `LCC = design + construction + O&M + siteMgmt`.

### Pitfall 2: toBeCloseTo Precision Confusion
**What goes wrong:** `toBeCloseTo(0.1 + 0.2, 5)` vs `toBeCloseTo(value, 2)` -- the `numDigits` parameter controls the exponent in the tolerance formula `|a - b| < 10^(-numDigits) / 2`.
**Why it happens:** Developers confuse "2 decimal places" (0.01 tolerance) with "2 significant digits."
**How to avoid:** Use `numDigits=2` for currency (tolerance = 0.005 EUR), `numDigits=4` for rates (tolerance = 0.00005). For exact match on rounded values, use `toBe()` after manual rounding.
**Warning signs:** Tests pass but with unexpected tolerance; or tests fail on values that look identical when printed.

### Pitfall 3: MNT-BUG-001 Fixture Design
**What goes wrong:** The formula mode test doesn't trigger the bug because the test fixture doesn't have a service component at the last position with a lifespan that creates a replacement year within the reference period.
**Why it happens:** MNT-BUG-001 only affects the LAST service component in the list, and only when a replacement year occurs (year divisible by lifespan).
**How to avoid:** Ensure the golden fixture has at least 2 service components, with the last one having a lifespan that divides evenly into a year within the reference period (e.g., lifespan=15, period=40 -> replacements at years 15 and 30). In `excel_replica` mode, those replacements use exponent=9 instead of exponent=year.
**Warning signs:** `excel_replica` and `excel_bugfixed` produce identical values -- the bug isn't being exercised.

### Pitfall 4: JSON Import Type Safety
**What goes wrong:** Importing JSON fixture directly gives `any` type; TypeScript doesn't catch mismatched property names.
**Why it happens:** JSON modules don't have `.d.ts` declarations by default.
**How to avoid:** Cast the imported JSON through the `VariantInput` type: `const input: VariantInput = goldenFixture.input as VariantInput`. Better: create a typed wrapper in `helpers.ts`.
**Warning signs:** Tests access `fixture.input.referencePerid` (typo) without compile error.

### Pitfall 5: Maintenance Discounting Uses Rint, Not RR
**What goes wrong:** Test expects maintenance values discounted by RR (real rate) but engine uses Rint (nominal rate) per DEC-005.
**Why it happens:** Energy uses RR for discounting; maintenance intentionally uses Rint. This asymmetry is easy to forget.
**How to avoid:** When computing expected maintenance values for the golden fixture, always use `interestRate` (Rint), not `realInterestRate` (RR).
**Warning signs:** Energy tests pass but maintenance tests fail with systematic offset.

## Code Examples

### Loading the Golden Fixture
```typescript
// tests/engine/helpers.ts
import fixture from '../fixtures/excel-reference.json';
import type { VariantInput, EngineConfig } from '@/engine/types';

export const GOLDEN_INPUT: VariantInput = fixture.input as unknown as VariantInput;
export const GOLDEN_EXPECTED = fixture.expected;

export function baseInput(): VariantInput {
  return structuredClone(GOLDEN_INPUT);
}

export function inputWith(overrides: Partial<VariantInput>): VariantInput {
  return { ...baseInput(), ...overrides };
}

export const EXCEL_REPLICA_CONFIG: EngineConfig = {
  formulaMode: 'excel_replica',
  maxReplacementCycles: 3,
};

export const BUGFIXED_CONFIG: EngineConfig = {
  formulaMode: 'excel_bugfixed',
  maxReplacementCycles: 3,
};
```

### Discount Module Test
```typescript
// tests/engine/discount.test.ts
import { describe, it, expect } from 'vitest';
import { computeRealInterestRate, computeDiscountFactors } from '@/engine/discount';
import { GOLDEN_INPUT, GOLDEN_EXPECTED } from './helpers';

describe('FIN-001: Real interest rate', () => {
  it('computes RR from Rint and Ri', () => {
    const rr = computeRealInterestRate(
      GOLDEN_INPUT.interestRate,
      GOLDEN_INPUT.inflationRate,
    );
    expect(rr).toBeCloseTo(GOLDEN_EXPECTED.realInterestRate, 4);
  });
});

describe('FIN-002: Discount factors', () => {
  it('produces correct factors at key years', () => {
    const rr = computeRealInterestRate(
      GOLDEN_INPUT.interestRate,
      GOLDEN_INPUT.inflationRate,
    );
    const factors = computeDiscountFactors(rr, GOLDEN_INPUT.referencePeriod);
    expect(factors[0]).toBe(1.0);
    expect(factors[1]).toBeCloseTo(GOLDEN_EXPECTED.discountFactors.year1, 4);
    expect(factors[10]).toBeCloseTo(GOLDEN_EXPECTED.discountFactors.year10, 4);
  });
});
```

### Formula Mode Test
```typescript
// tests/engine/maintenance.test.ts (formula mode section)
import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine';
import { baseInput, EXCEL_REPLICA_CONFIG, BUGFIXED_CONFIG } from './helpers';

describe('MNT-BUG-001: Formula mode toggle', () => {
  it('excel_replica and excel_bugfixed produce different maintenance totals', () => {
    const input = baseInput();
    const replica = calculateLCC(input, EXCEL_REPLICA_CONFIG);
    const bugfixed = calculateLCC(input, BUGFIXED_CONFIG);

    // Both must complete without error
    expect(replica.maintenanceAtRefPeriod).toBeDefined();
    expect(bugfixed.maintenanceAtRefPeriod).toBeDefined();

    // The bug causes different discounting for the last service component
    expect(replica.maintenanceAtRefPeriod).not.toBeCloseTo(
      bugfixed.maintenanceAtRefPeriod, 2
    );
  });
});
```

### Edge Case Test
```typescript
// tests/engine/edge-cases.test.ts
import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine';
import { inputWith, baseInput, BUGFIXED_CONFIG } from './helpers';

describe('Edge cases', () => {
  it('treatedFloorArea = 0 produces null KPIs', () => {
    const result = calculateLCC(
      inputWith({ treatedFloorArea: 0 }),
      BUGFIXED_CONFIG,
    );
    expect(result.kpiLCCPerM2).toBeNull();
    expect(result.kpiWLCPerM2).toBeNull();
  });

  it('referencePeriod = 1 produces valid output', () => {
    const result = calculateLCC(
      inputWith({ referencePeriod: 1 }),
      BUGFIXED_CONFIG,
    );
    expect(result.heatingCosts.nominal).toHaveLength(2); // [year0, year1]
    expect(result.lcc).toBeGreaterThanOrEqual(0);
  });

  it('no energy inputs produces zero energy costs', () => {
    const result = calculateLCC(
      inputWith({ energyInputs: [] }),
      BUGFIXED_CONFIG,
    );
    expect(result.energyConsumed).toBe(0);
    expect(result.energyProduced).toBe(0);
  });

  it('no service components produces zero service maintenance', () => {
    const result = calculateLCC(
      inputWith({ serviceComponents: [] }),
      BUGFIXED_CONFIG,
    );
    expect(result.maintenanceServices.every(v => v === 0)).toBe(true);
  });

  it('no income data produces null income', () => {
    const input = baseInput();
    delete (input as any).incomeInput;
    const result = calculateLCC(input, BUGFIXED_CONFIG);
    expect(result.income).toBeNull();
  });

  it('all-zero costs produces LCC = 0', () => {
    const result = calculateLCC(
      inputWith({
        costItems: [],
        serviceComponents: [],
        energyInputs: [],
        designCosts: [],
        wlcInput: {
          landCost: 0, enablingCosts: 0, planningFees: 0,
          userSupportPropMgmt: 0, userSupportCharges: 0, userSupportAdmin: 0,
          financeCost: 0, designCostsTotal: 0, siteManagementCostsTotal: 0,
        },
        buildingElementMaintenancePercent: 0,
      }),
      BUGFIXED_CONFIG,
    );
    expect(result.lcc).toBe(0);
    expect(result.wlc).toBe(0);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + ts-jest | Vitest (Vite-native) | 2023+ | No separate TypeScript compilation step; faster HMR |
| Vitest 1.x `globals: true` implicit | Vitest 4.x `globals: true` still supported | v2+ | Config unchanged, explicit imports also work |
| Manual tolerance functions | Built-in `toBeCloseTo(val, numDigits)` | Always in Vitest | No custom code needed for float comparison |

**Deprecated/outdated:**
- `vite-tsconfig-paths` plugin: Vitest 4 warns that Vite now supports `resolve.tsconfigPaths: true` natively. Not blocking but should be updated.

## Open Questions

1. **Exact golden fixture input values**
   - What we know: Rint=1.51%, Ri=0.56% are in the Excel. Reference period and TFA come from TASK 6 seed plan (40 years, 1750m2). Energy prices, consumption values, cost items, and service components need realistic values.
   - What's unclear: The exact energy prices per source, specific consumption values, cost item amounts, and service component details for the Base variant. The workbook was empty when extracted.
   - Recommendation: Use the TASK 6 seed data plan as the source of realistic values. Construct the golden fixture with the same data, then compute expected outputs by hand following formula-map.md. This also ensures the seed and tests are consistent.

2. **Whether to move existing validation tests**
   - What we know: `src/engine/__tests__/validation.test.ts` (17 tests) lives inside the engine source tree. New tests go in `tests/engine/`.
   - What's unclear: Whether having tests in two locations is confusing.
   - Recommendation: Leave them in place. The existing location follows the "co-located tests" pattern (tests next to source). The new `tests/engine/` tests follow the "golden fixture" pattern (tests against external reference data). Both are valid and serve different purposes.

3. **Integration test: compare every field or just key outputs?**
   - What we know: The implementation plan says "validates every output field." LCCResult has ~30 top-level fields plus time series arrays.
   - What's unclear: Whether to compare all 41 elements of each time series array or just spot-check key years.
   - Recommendation: Compare all top-level scalar fields exactly. For time series arrays, verify length and spot-check years 1, 10, 20, N (reference period). If any spot-check fails, add full array comparison for debugging.

## Sources

### Primary (HIGH confidence)
- `C:/llc-calculator-app/vitest.config.ts` -- Vitest configuration (v4.1.1, node environment, include patterns)
- `C:/llc-calculator-app/src/engine/index.ts` -- calculateLCC orchestrator (160 lines, 7 modules)
- `C:/llc-calculator-app/src/engine/types.ts` -- VariantInput, LCCResult, EngineConfig interfaces
- `C:/llc-calculator-app/src/engine/maintenance.ts` -- MNT-BUG-001 implementation (line 80-86)
- `C:/llc-calculator-app/docs/formula-map.md` -- 39 formula IDs with Excel cell references
- `C:/llc-calculator-app/scripts/output/formulas_raw.json` -- 23,668 extracted formulas (cached values mostly 0)
- `C:/llc-calculator-app/scripts/output/en15459.json` -- 79 HVAC components with lifespan/maintenance data
- https://vitest.dev/api/expect.html -- toBeCloseTo documentation
- https://vitest.dev/api/#test-each -- Parametric test API

### Secondary (MEDIUM confidence)
- https://vitest.dev/guide/improving-performance -- Vitest performance tips
- https://calmops.com/programming/javascript/javascript-testing-guide-2026/ -- 2026 testing patterns overview

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vitest 4.1.1 already installed and verified working (18 tests pass)
- Architecture: HIGH - Engine modules have clear interfaces, all exported functions documented with formula IDs
- Pitfalls: HIGH - Known from direct code inspection: MNT-BUG-001 mechanics, Rint vs RR asymmetry, empty workbook cached values
- Golden fixture strategy: MEDIUM - Manually constructing expected values carries arithmetic risk; mitigation is step-by-step computation with cross-checks

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable domain, no API changes expected)

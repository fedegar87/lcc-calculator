# Phase 11: Test & Code Quality Cleanup - Research

**Researched:** 2026-03-28
**Domain:** Test coverage, API validation, code deduplication
**Confidence:** HIGH

## Summary

Phase 11 is a tech-debt closure phase with four well-scoped tasks: (1) create edge-case tests for the calculation engine, (2) document the useQueries pattern as intentional for batch calculation, (3) add validateVariantInput calls at tRPC API boundaries, and (4) remove duplicate `d()` and `resolveDetailCost()` helpers from variant.ts and cost-item.ts.

All tasks operate on existing, stable code. No new libraries, no architecture changes, no UI modifications. The codebase is well-structured with clear patterns to follow.

**Primary recommendation:** Execute as two sequential plans -- Plan 01 for code deduplication + validation (code changes), Plan 02 for edge-case tests + documentation (test/doc additions).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Document useQueries as the intentional pattern -- no calculateAll endpoint needed
- Max 3 variants (BASE + VARIANT_1 + VARIANT_2) makes parallel useQueries appropriate
- Documentation lives as code comment near useQueries call in variant-comparison.tsx
- Call validateVariantInput in tRPC calculation and export procedures BEFORE engine invocation
- Throw TRPCError with code BAD_REQUEST and validation messages on failure
- Validation runs on every calculation trigger, not just export
- UI surfaces validation errors via Sonner error toast listing the issues
- Create edge-cases.test.ts covering: zero investment cost, empty energy inputs, single cost item only, extreme reference periods, 0% rates, zero treated floor area
- Assertion style: no-crash + structural checks (valid LCCResult shape, finite numbers)
- No golden-value assertions for edge cases
- Consolidate d() helper to _shared.ts only -- remove duplicates from variant.ts and cost-item.ts
- Import from _shared.ts in all consumers

### Claude's Discretion
- Exact list of edge case scenarios beyond the ones specified
- How to structure the import refactoring for d() helper
- Whether to add any defensive checks alongside validation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-05 | Edge cases: zero area, min period, no energy, no services, no income, all-zero costs | Vitest setup confirmed, validation.test.ts provides fixture pattern, calculateLCC throws on invalid input |
| API-05 | Calculate router: calculate single variant, calculateAll for comparison | useQueries pattern already implemented in variant-comparison.tsx; document as intentional |
| DATA-09 | Input validation rules with plausible range checks | validateVariantInput exists in engine/validation.ts; needs calling at tRPC boundary |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | (project config) | Unit/integration testing | Already configured with tsconfig paths, glob patterns |
| tRPC v11 | (project dep) | API layer where validation is added | TRPCError with BAD_REQUEST code is established pattern |

### Supporting
No new libraries needed. All tools are already in the project.

## Architecture Patterns

### Current Code Structure
```
src/engine/
  validation.ts        # validateVariantInput - already exists, complete
  __tests__/
    validation.test.ts # Validation tests - provides test fixture pattern
    (edge-cases.test.ts) # NEW - to be created

src/server/trpc/routers/
  _shared.ts           # d(), resolveDetailCost(), buildVariantInput - canonical
  variant.ts           # DUPLICATE d() on line 7
  cost-item.ts         # DUPLICATE d() on line 31, DUPLICATE resolveDetailCost on line 37
  calculation.ts       # Needs validateVariantInput call before line 69
  export.ts            # Needs validateVariantInput call before lines 117 and 220

src/components/results/
  variant-comparison.tsx # useQueries on line 56 - needs explanatory comment
```

### Pattern 1: TRPCError for Validation Failures
**What:** Throw TRPCError with BAD_REQUEST when validateVariantInput returns errors
**When to use:** At every tRPC procedure that calls calculateLCC
**Example from existing code (project.ts addVariant pattern):**
```typescript
import { validateVariantInput } from "@/engine/validation";

// After buildVariantInput, before calculateLCC:
const validationErrors = validateVariantInput(variantInput);
if (validationErrors.length > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Validation failed: ${validationErrors.join("; ")}`,
  });
}
```

### Pattern 2: Import from _shared.ts
**What:** All routers import d() and resolveDetailCost() from _shared.ts
**Example:**
```typescript
import { d, resolveDetailCost } from "./_shared";
```

### Anti-Patterns to Avoid
- **Duplicating utility functions across routers:** Already happened with d() and resolveDetailCost(). Fix by centralizing imports.
- **Catching engine errors silently:** calculation.ts has `catch {}` that swallows errors. Validation at API boundary prevents invalid input reaching engine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch calculation | calculateAll tRPC endpoint | useQueries in client | Max 3 variants, parallel fetching already works |
| Input validation | Custom Zod schemas at API | Engine's validateVariantInput | Already comprehensive, tested, single source of truth |

## Common Pitfalls

### Pitfall 1: Validation Double-Throw
**What goes wrong:** Engine's calculateLCC already calls validateVariantInput internally and throws Error. Adding validation at tRPC boundary means validation runs twice.
**Why it happens:** Both layers validate independently.
**How to avoid:** This is acceptable -- tRPC layer throws TRPCError (clean HTTP response), engine throws plain Error (safety net). The double validation is intentional defense-in-depth. The TRPCError from tRPC layer will fire first, preventing engine invocation.
**Warning signs:** If someone removes engine validation thinking tRPC handles it.

### Pitfall 2: Missing Import After Removing Local Function
**What goes wrong:** Removing `function d()` from variant.ts without adding the import from _shared.ts causes TypeScript compilation error.
**Why it happens:** Mechanical refactoring.
**How to avoid:** Always add import BEFORE removing local function. TypeScript compiler will catch it.

### Pitfall 3: Edge Case Tests That Assert Specific Values
**What goes wrong:** Edge case inputs produce mathematically valid but hard-to-predict values. Golden-value assertions make tests brittle.
**Why it happens:** Copy-pasting from integration test patterns.
**How to avoid:** CONTEXT.md explicitly says "no golden-value assertions for edge cases." Use structural checks: typeof, isFinite, shape validation.

## Code Examples

### Edge Case Test Pattern (from validation.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import { calculateLCC } from '../index';
import type { VariantInput } from '../types';

function minimalInput(): VariantInput {
  return {
    referencePeriod: 30,
    interestRate: 0.03,
    inflationRate: 0.02,
    treatedFloorArea: 500,
    energyPrices: [{ index: 12, name: 'Electricity', pricePerKwh: 0.25, annualIncrease: 0.02 }],
    energyInputs: [],
    costItems: [],
    serviceComponents: [],
    buildingElementMaintenancePercent: 0.01,
    wlcInput: { landCost: 0, enablingCosts: 0, planningFees: 0, userSupportPropMgmt: 0, userSupportCharges: 0, userSupportAdmin: 0, financeCost: 0, designCostsTotal: 0, siteManagementCostsTotal: 0 },
    designCosts: [],
  };
}

it('handles zero investment cost without crashing', () => {
  const input = minimalInput();
  const result = calculateLCC(input);
  expect(result).toBeDefined();
  expect(typeof result.lcc).toBe('number');
  expect(Number.isFinite(result.lcc)).toBe(true);
});
```

### Validation at tRPC Boundary
```typescript
const variantInput = buildVariantInput(variant);

const validationErrors = validateVariantInput(variantInput);
if (validationErrors.length > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Input validation failed: ${validationErrors.join("; ")}`,
  });
}

const result = calculateLCC(variantInput, { ... });
```

## State of the Art

No changes. All patterns use current versions already in the project.

## Open Questions

None. All decisions are locked, all code locations identified, all patterns verified from existing codebase.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all affected files
- Existing validation.test.ts provides tested fixture pattern
- Existing _shared.ts provides canonical d() and resolveDetailCost()
- Existing calculation.ts and export.ts show where validation calls are needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing code
- Architecture: HIGH - patterns verified from codebase
- Pitfalls: HIGH - straightforward refactoring with TypeScript safety net

**Research date:** 2026-03-28
**Valid until:** No expiry - codebase-specific findings, not library-dependent

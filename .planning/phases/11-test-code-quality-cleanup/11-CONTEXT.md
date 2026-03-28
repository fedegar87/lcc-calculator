# Phase 11: Test & Code Quality Cleanup - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Close remaining low-severity audit gaps: fix test compilation (TEST-05), add/document batch calculation (API-05), validate at API boundary (DATA-09), remove code duplication. No new features -- purely technical debt closure.

</domain>

<decisions>
## Implementation Decisions

### Batch calculation approach (API-05)
- Document useQueries as the intentional pattern -- no calculateAll endpoint needed
- Max 3 variants (BASE + VARIANT_1 + VARIANT_2) makes parallel useQueries appropriate
- Documentation lives as code comment near useQueries call in variant-comparison.tsx

### Validation at API boundary (DATA-09)
- Call validateVariantInput in tRPC calculation and export procedures BEFORE engine invocation
- Throw TRPCError with code BAD_REQUEST and validation messages on failure
- Validation runs on every calculation trigger, not just export
- UI surfaces validation errors via Sonner error toast listing the issues

### Edge case test scope (TEST-05)
- Create edge-cases.test.ts covering calculation degenerate inputs:
  - Zero investment cost (KPI division by zero)
  - Empty energy inputs array
  - Single cost item only
  - Extreme reference periods (1 year, 100 years)
  - 0% interest rate and inflation rate
  - Zero treated floor area (KPIs should be null)
- Assertion style: no-crash + structural checks (valid LCCResult shape, finite numbers)
- No golden-value assertions for edge cases

### Code deduplication
- Consolidate d() helper to _shared.ts only -- remove duplicates from variant.ts and cost-item.ts
- Import from _shared.ts in all consumers

### Claude's Discretion
- Exact list of edge case scenarios beyond the ones specified
- How to structure the import refactoring for d() helper
- Whether to add any defensive checks alongside validation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validateVariantInput` (`src/engine/validation.ts`): Already exists with comprehensive boundary checks
- `d()` helper (`src/server/trpc/routers/_shared.ts`): Canonical location, already exported
- `validation.test.ts`: Existing test patterns for validation assertions

### Established Patterns
- TRPCError with BAD_REQUEST code for input validation (used in project.ts addVariant)
- Sonner toast for error display (used throughout app)
- useQueries for parallel data fetching (variant-comparison.tsx)
- Vitest describe/it/expect pattern for engine tests

### Integration Points
- `src/server/trpc/routers/calculation.ts`: Needs validateVariantInput call before computeLCC
- `src/server/trpc/routers/export.ts`: Needs validateVariantInput call before computeLCC
- `src/server/trpc/routers/variant.ts`: Has duplicate d(), needs import from _shared.ts
- `src/server/trpc/routers/cost-item.ts`: Has duplicate d(), needs import from _shared.ts
- `src/components/results/variant-comparison.tsx`: Needs useQueries comment

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 11-test-code-quality-cleanup*
*Context gathered: 2026-03-28*

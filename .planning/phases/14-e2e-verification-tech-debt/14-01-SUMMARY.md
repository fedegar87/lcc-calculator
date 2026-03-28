# Plan 14-01: Tech Debt Closure — Summary

**Status:** Complete
**Started:** 2026-03-28
**Completed:** 2026-03-28

## What was done

1. **DEBT-02 — z.enum() for variantLabel**: Replaced `z.string()` with `z.enum(["BASE", "VARIANT_1", "VARIANT_2"])` in export input schema. Removed `VARIANT_LABEL_MAP` constant and runtime guards (enum handles validation at parse time). Both `generatePdf` and `generateExcel` use direct cast to `PrismaVariantLabel`.

2. **DEBT-01 — Document orphaned procedures**: Added `@future` JSDoc annotations to 5 orphaned tRPC procedures:
   - `project.delete` — Reserved for project deletion UI
   - `project.addMember` — Reserved for team collaboration UI
   - `project.removeMember` — Reserved for team collaboration UI
   - `costItem.delete` — Reserved for cost item deletion UI
   - `costItem.batchUpsert` — Reserved for bulk import/paste UI

## Key files

### Modified
- `src/server/trpc/routers/export.ts` — z.enum() + removed VARIANT_LABEL_MAP
- `src/server/trpc/routers/project.ts` — 3x @future annotations
- `src/server/trpc/routers/cost-item.ts` — 2x @future annotations

## Self-Check: PASSED

- [x] variantLabel uses z.enum(["BASE", "VARIANT_1", "VARIANT_2"])
- [x] VARIANT_LABEL_MAP removed
- [x] 3 @future in project.ts, 2 @future in cost-item.ts
- [x] 152 tests pass
- [x] No new type errors

## Deviations

None.

---
phase: 07-trpc-api-authentication
plan: 02
subsystem: api, auth
tags: [trpc, prisma, project-crud, cost-item, middleware, role-based-access]

requires:
  - phase: 07-trpc-api-authentication
    provides: tRPC context with auth, protectedProcedure, requireProjectRole middleware, reference router
  - phase: 03-schema-types-constants
    provides: Prisma schema with Project, Variant, CostItem, CostItemDetail, ProjectMember models
provides:
  - Project CRUD router with 8 procedures (list, getById, create, update, delete, addMember, removeMember, addVariant)
  - Cost-item router with 6 procedures (listByVariant, upsert, delete, upsertDetail, deleteDetail, batchUpsert)
  - Next.js middleware redirecting unauthenticated users from /projects/* and /dashboard/* to /login
  - MAX(materialCost, unitPrice*area) detail cost resolution in aggregate recomputation
affects: [07-03, 08-ui-components]

tech-stack:
  added: []
  patterns: [project-crud-with-member-management, cost-item-aggregate-recomputation, nextjs-route-protection-middleware]

key-files:
  created:
    - src/server/trpc/routers/project.ts
    - src/server/trpc/routers/cost-item.ts
    - src/middleware.ts
  modified: []

key-decisions:
  - "Inline access checks for simple ownership patterns; requireProjectRole middleware for multi-role procedures like addVariant"
  - "Variant creation includes default Geometry, BoundaryCondition, MaintenanceConfig sub-records for immediate usability"
  - "Cost-item aggregate recomputation runs after every detail mutation (upsert/delete/batch) to keep data consistent"
  - "batchUpsert replaces all details per item (delete + recreate) within a transaction for atomic batch operations"

patterns-established:
  - "Access verification pattern: walk relation chain (detail -> costItem -> variant -> project) to verify ownership/membership"
  - "Decimal serialization pattern: d() helper converts Prisma Decimal to plain number before returning to client"
  - "Cost resolution pattern: MAX(materialCost, unitPrice*area) per architecture decision from Excel audit"
  - "Cookie-presence middleware: fast redirect for unauthenticated users, full validation deferred to tRPC context"

requirements-completed: [API-02, API-04, AUTH-04, AUTH-05]

duration: 5min
completed: 2026-03-27
---

# Phase 7 Plan 02: Project/Cost-Item Routers + Route Protection Summary

**Project CRUD with member management (8 procedures), cost-item router with detail-level CRUD and MAX(mat, unit*area) aggregate recomputation (6 procedures), and Next.js middleware for /projects and /dashboard route protection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T09:49:00Z
- **Completed:** 2026-03-27T09:54:31Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Project router with full CRUD, OWNER-only member management (add/remove), OWNER/EDITOR variant addition, and BASE variant auto-creation with default sub-records
- Cost-item router with individual detail CRUD triggering aggregate recomputation, batch upsert with transactional detail replacement, and proper Decimal-to-number serialization
- Next.js middleware at src/middleware.ts protecting /projects/* and /dashboard/* routes via Better Auth session cookie check

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project router with CRUD and member management** - `1dcbe63` (feat)
2. **Task 2: Create cost-item router with detail CRUD and aggregate recomputation** - `eb52436` (feat)
3. **Task 3: Create Next.js middleware for route protection** - `4900c7b` (feat)

## Files Created/Modified
- `src/server/trpc/routers/project.ts` - Project CRUD (8 procedures): list, getById, create, update, delete, addMember, removeMember, addVariant
- `src/server/trpc/routers/cost-item.ts` - CostItem + CostItemDetail CRUD (6 procedures) with aggregate recomputation and Decimal serialization
- `src/middleware.ts` - Next.js middleware redirecting unauthenticated users to /login for protected routes

## Decisions Made
- Used inline access checks (userId === ctx.user.id) for simple ownership patterns, and requireProjectRole middleware only for addVariant where multi-role reuse benefits from middleware
- Variant creation (both initial BASE and addVariant) creates default Geometry, BoundaryCondition, and MaintenanceConfig sub-records so variants are immediately usable without additional setup
- batchUpsert deletes existing details and recreates them (replace pattern) within a transaction, rather than diffing individual rows, for simplicity and atomicity
- Cost-item aggregate recomputation runs inline after every detail mutation to keep materialCostAgg, laborCostAgg, otherCostAgg always consistent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Project and cost-item routers ready for UI consumption in phase 08
- Route protection middleware active for all protected app pages
- Next plan (07-03) can build remaining routers (calculation trigger, variant data, snapshots) on this foundation
- All 14 procedures (8 project + 6 cost-item) follow consistent access check patterns

## Self-Check: PASSED

All 3 created files verified on disk. All 3 task commits (1dcbe63, eb52436, 4900c7b) verified in git log.

---
*Phase: 07-trpc-api-authentication*
*Completed: 2026-03-27*

---
phase: 03-schema-types-constants
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, decimal, better-auth, enums]

requires:
  - phase: 01-project-scaffolding
    provides: Prisma 7 generator config, prisma.config.ts, src/lib/prisma.ts singleton
provides:
  - Complete Prisma schema with 20 models, 6 enums, all relations and constraints
  - Migration-ready prisma.config.ts with DATABASE_URL for prisma migrate dev
  - CostCategory (21 values), EndUse (8 values), FormulaMode, BuildingUse, MemberRole, VariantLabel enums
  - Better Auth models (User, Session, Account, Verification)
affects: [03-02, 04-engine, 06-seed, 07-api, 08-ui]

tech-stack:
  added: []
  patterns:
    - "Better Auth model conventions (not Auth.js/NextAuth)"
    - "All monetary Decimal fields use @db.Decimal(14,2)"
    - "All rate/percentage Decimal fields use @db.Decimal(10,8) or @db.Decimal(8,6)"
    - "Json fields for nested data (energyPrices, inputs, outputs)"
    - "Cascade delete from Project/Variant through all children"
    - "@@index on all foreign keys"
    - "Adapter-only datasource (no url in schema.prisma)"

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - prisma.config.ts

key-decisions:
  - "Better Auth field conventions over Auth.js (Session.token not sessionToken, User.emailVerified as Boolean not DateTime)"
  - "IncomeInput flat fields (rent1/2/3, otherIncome1/2/3) instead of JSON for type safety and direct SQL queries"
  - "Single schema.prisma file with section comments (not multi-file)"

patterns-established:
  - "Better Auth models: User, Session, Account, Verification with correct field names"
  - "Decimal precision: monetary=14,2 rates=10,8 maintenance%=8,6 U-values=8,4"
  - "Json @default for arrays: @default(\"[]\") for BoundaryCondition.energyPrices"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06]

duration: 3min
completed: 2026-03-26
---

# Phase 3 Plan 1: Prisma Schema Summary

**Complete Prisma schema with 20 models, 6 enums, Better Auth conventions, Decimal precision annotations, and cascade-delete relations for PostgreSQL**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T19:16:01Z
- **Completed:** 2026-03-26T19:19:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Defined all 20 domain models covering auth, project, variant, geometry, boundary conditions, energy, costs, services, WLC, design, income, maintenance, snapshots, revisions, and exports
- Applied Better Auth model conventions (User, Session, Account, Verification) instead of Auth.js to prevent runtime adapter errors
- All Decimal fields annotated with @db.Decimal(precision, scale) -- no bare Decimals in schema
- Added migrate.url() to prisma.config.ts enabling prisma migrate dev without adding url to datasource block

## Task Commits

Each task was committed atomically:

1. **Task 1: Update prisma.config.ts for migration support** - `cf21fff` (chore)
2. **Task 2: Write complete Prisma schema with all models and enums** - `b2d77f3` (feat)

## Files Created/Modified

- `prisma.config.ts` - Added migrate block with DATABASE_URL for migration support
- `prisma/schema.prisma` - Complete schema: 20 models, 6 enums, 19 cascade deletes, 13 indexes

## Decisions Made

- **Better Auth over Auth.js conventions:** Session.token (not sessionToken), Session.expiresAt (not expires), User.emailVerified as Boolean (not DateTime?), Account.accountId/providerId (not provider/providerAccountId), Verification model (not VerificationToken). Prevents runtime adapter errors with Better Auth.
- **Flat fields for IncomeInput:** rent1/2/3 and otherIncome1/2/3 as individual Decimal columns instead of JSON arrays. Enables direct SQL queries, compile-time type safety, per-field precision annotations.
- **Single schema file:** All 20 models in one prisma/schema.prisma with section comments. Multi-file would require prismaSchemaFolder feature flag for ~20 models.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema validates successfully against PostgreSQL dialect via `npx prisma validate`
- Ready for Plan 03-02 (engine types, EN 15459 constants, input validation)
- Ready for Phase 6 (database seed) and Phase 7 (tRPC API) once migrations are run
- No blockers or concerns

---
*Phase: 03-schema-types-constants*
*Completed: 2026-03-26*

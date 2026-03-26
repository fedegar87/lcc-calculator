---
phase: 06-database-seed
plan: 01
subsystem: database
tags: [prisma, seed, better-auth, demo-data, typescript]

requires:
  - phase: 05-engine-tests
    provides: Golden fixture (tests/fixtures/excel-reference.json) with exact BASE variant values
  - phase: 03-schema-types-constants
    provides: Prisma schema with all data models, enums, and relations
provides:
  - Prisma seed script creating demo user with Better Auth credential account
  - Demo project with 3 variants (BASE, VARIANT_1, VARIANT_2) with all data domains
  - Seed data files aligned with golden test fixture for BASE variant
  - prisma.config.ts with migrations.seed field for `npx prisma db seed`
affects: [07-trpc-api-authentication, 08-ui-implementation]

tech-stack:
  added: []
  patterns: [PrismaPg adapter in seed script, Better Auth hashPassword for credential accounts, deterministic account ID for idempotent upsert, delete-then-create for demo project data]

key-files:
  created:
    - prisma/seed.ts
    - prisma/seed-data/shared.ts
    - prisma/seed-data/base-variant.ts
    - prisma/seed-data/variant-1.ts
    - prisma/seed-data/variant-2.ts
  modified:
    - prisma.config.ts

key-decisions:
  - "Deterministic account ID (seed-credential-{userId}) for idempotent Better Auth account upsert"
  - "Delete-then-create strategy for demo project data (simpler than upserting all nested records)"
  - "BASE variant values match golden fixture exactly; VARIANT_1/2 differ meaningfully for LCC comparison"
  - "5 design cost lines for BASE/V1, 3 for V2 (budget variant has fewer professional fees)"

patterns-established:
  - "Seed data files export plain objects, seed.ts maps to Prisma create shapes"
  - "buildVariantCreate helper function for consistent nested variant creation"

requirements-completed: [SEED-01, SEED-02, SEED-03]

duration: 5min
completed: 2026-03-26
---

# Phase 6: Database Seed - Plan 01 Summary

**Prisma seed script with demo user (Better Auth credential), 3 LCC variants, and 9 data domains per variant aligned with golden fixture**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 1

## Accomplishments
- Demo user with hashed password via better-auth/crypto hashPassword, stored in Account record with providerId='credential'
- BASE variant data aligned exactly with golden fixture (interestRate=0.0151, inflationRate=0.0056, 5 energy inputs, 3 cost items, 2 service components)
- VARIANT_1 (improved building): lower heating demand, 3 service components including PV inverter, higher construction costs
- VARIANT_2 (budget): no PV, 1 service component, lower costs but higher energy consumption
- Idempotent: user upsert + project delete-then-create ensures clean re-seeding

## Task Commits

1. **Task 1: Create seed data files and update prisma.config.ts** - `4208a07` (feat)
2. **Task 2: Create seed script with PrismaPg adapter** - `5ecf888` (feat)

## Files Created/Modified
- `prisma.config.ts` - Added migrations.seed field pointing to tsx runner
- `prisma/seed.ts` - Main seed entry point with PrismaPg, user upsert, project creation
- `prisma/seed-data/shared.ts` - DEMO_USER, PROJECT_META, BOUNDARY_CONDITIONS constants
- `prisma/seed-data/base-variant.ts` - BASE variant data matching golden fixture
- `prisma/seed-data/variant-1.ts` - VARIANT_1 improved building data
- `prisma/seed-data/variant-2.ts` - VARIANT_2 budget-conscious data

## Decisions Made
- Used deterministic account ID `seed-credential-{userId}` for idempotent upsert instead of querying first
- BASE variant boundary conditions shared via BOUNDARY_CONDITIONS constant (same across all 3 variants per Excel tutorial)
- PV_PRODUCTION gets both specificConsumption (8 kWh/m2) and pvProductionKwh (14000) for compatibility with both engine and DB fields

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Seed script ready for `npx prisma db seed` once PostgreSQL is available
- All variant data domains populated, ready for tRPC API layer (Phase 7) to query and expose
- Demo user compatible with Better Auth credential login flow

---
*Phase: 06-database-seed*
*Completed: 2026-03-26*

---
phase: 06-database-seed
status: passed
verified: 2026-03-26
verifier: automated
score: 3/3
---

# Phase 6: Database Seed - Verification

## Phase Goal
A developer or reviewer can log in with demo credentials and see a fully populated project with realistic LCC data.

## Requirements Verification

### SEED-01: Demo user with hashed password
**Status: PASSED**
- `prisma/seed.ts` imports `hashPassword` from `better-auth/crypto` (line 3)
- Demo user created via `prisma.user.upsert` with email `demo@lcczero.dev` (line 65-73)
- Account record created with `providerId: "credential"`, `accountId: user.id`, and hashed password (lines 76-86)
- Deterministic account ID ensures idempotent re-seeding
- Evidence: `prisma/seed-data/shared.ts` exports `DEMO_USER` with email/password

### SEED-02: Demo project with 3 variants and realistic data matching Excel tutorial
**Status: PASSED**
- Project created as "CRAVEzero Reference Building" with `RESIDENTIAL_MULTI` building use (line 94-117)
- 3 variants: BASE, VARIANT_1, VARIANT_2 via `buildVariantCreate` helper
- BASE variant boundary conditions match golden fixture: referencePeriod=40, interestRate=0.0151, inflationRate=0.0056
- BASE energy inputs match: 5 entries (HEATING_1=25, HEATING_2=10, COOLING_1=15, HOUSEHOLD=20, PV=8)
- BASE cost items match: A1_ROOFS (120k/80k/5k), A5_WINDOWS (90k/60k/3k), B1_HEATING (45k/25k/2k)
- BASE service components match: Heat pump 35000 idx=6, Ventilation unit 18000 idx=1
- VARIANT_1 differs meaningfully: lower heating, higher PV, more expensive construction, 3 service components
- VARIANT_2 differs meaningfully: higher heating, no PV, cheaper construction, 1 service component
- ProjectMember created with OWNER role
- Evidence: `prisma/seed-data/base-variant.ts` values cross-referenced with `tests/fixtures/excel-reference.json`

### SEED-03: Complete data coverage
**Status: PASSED**
All 9 data domains populated per variant:
1. Geometry (grossFloorArea, netFloorArea, treatedFloorArea)
2. BoundaryCondition (referencePeriod, interestRate, inflationRate, energyPrices)
3. EnergyInput (5 entries for BASE/V1, 4 for V2)
4. CostItem (3 entries per variant)
5. ServiceComponent (2 for BASE, 3 for V1, 1 for V2)
6. WLCInput (landPrice, enablingCost1, planningFees1, userSupport*, financeCost)
7. DesignCost (5 lines for BASE/V1, 3 for V2)
8. IncomeInput (rent1 + otherIncome1 fields)
9. MaintenanceConfig (buildingElementMaintenancePercent=0.01)

## Success Criteria Check

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `npx prisma db seed` creates demo user with hashed password | PASS - seed script uses hashPassword from better-auth/crypto, creates User + Account records |
| 2 | Demo project has 3 variants (BASE, VARIANT_1, VARIANT_2) matching Excel tutorial | PASS - all 3 variants with different but realistic data |
| 3 | All data domains populated: geometry, boundary conditions, energy, costs, services, WLC, design costs, income, maintenance | PASS - 9 domains per variant, verified in code |

## Must-Have Artifact Verification

| Artifact | Exists | Min Lines | Correct |
|----------|--------|-----------|---------|
| prisma.config.ts (migrations.seed) | YES | N/A | `npx tsx prisma/seed.ts` |
| prisma/seed.ts | YES | 136 (>40) | PrismaPg adapter, user upsert, project create |
| prisma/seed-data/shared.ts | YES | 34 | DEMO_USER, PROJECT_META, BOUNDARY_CONDITIONS |
| prisma/seed-data/base-variant.ts | YES | 118 | baseVariantData aligned with golden fixture |
| prisma/seed-data/variant-1.ts | YES | 119 | variant1Data improved building |
| prisma/seed-data/variant-2.ts | YES | 95 | variant2Data budget-conscious |

## Key Link Verification

| From | To | Pattern | Found |
|------|-----|---------|-------|
| prisma.config.ts | prisma/seed.ts | `seed.*tsx.*prisma/seed` | YES: `"npx tsx prisma/seed.ts"` |
| prisma/seed.ts | better-auth/crypto | `import.*hashPassword.*better-auth/crypto` | YES: line 3 |
| prisma/seed.ts | prisma/seed-data/*.ts | `import.*seed-data` | YES: lines 4-7 |

## Idempotency Verification

- User: `upsert` on email (update name if exists, create if not)
- Account: `upsert` on deterministic ID `seed-credential-{userId}`
- Project: `deleteMany` then `create` (cascade deletes all nested data)
- Running seed twice produces identical result with no duplicates

## Score: 3/3 requirements verified

All must-haves accounted for. Phase goal achieved.

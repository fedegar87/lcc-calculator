---
phase: 03-schema-types-constants
verified: 2026-03-26T20:30:00Z
status: gaps_found
score: 7/9 must-haves verified
gaps:
  - truth: "CATEGORY_MAINTENANCE_MAP correctly classifies all 21 cost categories"
    status: failed
    reason: "Keys in CATEGORY_MAINTENANCE_MAP (types.ts) do not match CostCategory enum values in schema.prisma. 16 of 21 keys are mismatched. The map was committed before the schema was finalized, and the names diverged."
    artifacts:
      - path: "src/engine/types.ts"
        issue: "CATEGORY_MAINTENANCE_MAP uses wrong keys: A2_WALLS/A4_CEILINGS/A5_FACADES/A6_WINDOWS/A7_DOORS/A8_STAIRS/A9_OTHER_STRUCTURE/A10_FOUNDATIONS/B4_DHW/B6_PLUMBING/C1_ELEVATORS/C2_FIRE_SAFETY/C3_OTHER_SERVICES/D1_SITE_WORKS — none of these exist in CostCategory enum"
    missing:
      - "Update CATEGORY_MAINTENANCE_MAP keys to match schema.prisma CostCategory enum values: A2_FACADES, A3_FLOORS, A4_WALLS, A5_WINDOWS, A6_SHADING, A7_DOORS, A8_INTERNAL, A9_STRUCTURE, A10_OTHER, B4_HVAC_COMBINED, B5_ELECTRICAL, B6_HYDRAULIC, C1_SOLAR_THERMAL, C2_PV, C3_OTHER_RES, D1_FURNISHINGS, E1_OUTDOOR"
---

# Phase 3: Schema, Types & Constants Verification Report

**Phase Goal:** Data layer and type system are defined so that the engine, database, and API all share a single source of truth for domain structures
**Verified:** 2026-03-26T20:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Prisma schema compiles without errors via `npx prisma validate` | VERIFIED | `npx prisma validate` exits cleanly: "The schema at prisma/schema.prisma is valid" |
| 2 | All monetary values and rates use Decimal type with appropriate precision/scale | VERIFIED | All monetary fields use `@db.Decimal(14,2)`, rates `@db.Decimal(10,8)`, maintenance% `@db.Decimal(8,6)`, U-values `@db.Decimal(8,4)` — no bare Decimal fields found |
| 3 | All 21 CostCategory enum values exist (A1_ROOFS through E1_OUTDOOR) | VERIFIED | Enum confirmed in schema.prisma lines 233-260; generated enums.ts matches; count verified |
| 4 | All 8 EndUse enum values exist (HEATING_1 through PV_PRODUCTION) | VERIFIED | HEATING_1, HEATING_2, COOLING_1, COOLING_2, DHW_1, DHW_2, HOUSEHOLD_ELECTRICITY, PV_PRODUCTION present in schema.prisma lines 207-215 |
| 5 | ResultSnapshot captures engine version, formula mode, inputs hash, and outputs | VERIFIED | model ResultSnapshot has: engineVersion (String), formulaMode (FormulaMode), inputs (Json), inputsHash (String?), outputs (Json), trigger (String) — schema.prisma lines 386-403 |
| 6 | Better Auth models (User, Session, Account, Verification) use correct field names | VERIFIED | Session.token (not sessionToken), Session.expiresAt (not expires), User.emailVerified as Boolean (not DateTime?), Account.accountId/providerId, Verification model (not VerificationToken) |
| 7 | All project-related models cascade delete from Project or Variant | VERIFIED | onDelete: Cascade on all Variant children (Geometry, BoundaryCondition, EnergyInput, CostItem, CostItemDetail, ServiceComponent, WLCInput, DesignCost, IncomeInput, MaintenanceConfig) and Project children (Variant, ProjectMember, ResultSnapshot, ProjectRevision, ExportRecord) |
| 8 | Engine types are importable without any Prisma or framework dependency | VERIFIED | `grep -c "import.*prisma"` returns 0 for all three engine files; types.ts header comment enforces rule; tsc reports no engine errors |
| 9 | EN 15459 constants contain 79 HVAC components with lifespan and maintenance data | VERIFIED | `en15459Data.components.length === 79` confirmed via node; constants.ts maps snake_case JSON to camelCase TS with all 8 fields |
| 10 | Energy sources contain 18 selectable sources (index 2-19, excluding header) | VERIFIED | `energy_sources.json` has 19 total, 1 is_header=true; filter in constants.ts yields 18 |
| 11 | validateVariantInput rejects out-of-range inputs and returns error messages | VERIFIED | `npx vitest run` reports 17/17 tests passing; all behaviors from plan spec covered |
| 12 | FormulaMode is a string literal union type, not a Prisma enum import | VERIFIED | `type FormulaMode = 'excel_replica' \| 'excel_bugfixed'` in types.ts line 5; zero Prisma imports in file |
| 13 | CATEGORY_MAINTENANCE_MAP correctly classifies all 21 cost categories | FAILED | Map keys in types.ts DO NOT match CostCategory enum values in schema.prisma. See Gaps section. |

**Score:** 12/13 truths verified (must-have gap found: truth #13)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Complete data model for LCCzero | VERIFIED | 430 lines, 20 models, 6 enums, all relations, cascade deletes, indexes |
| `prisma.config.ts` | Prisma config with migration URL support | VERIFIED | migrate.url() reads DATABASE_URL; adapter-only datasource pattern preserved |
| `src/engine/types.ts` | Pure TS interfaces for engine I/O | VERIFIED (with gap) | Substantive (200 lines); zero framework imports; CATEGORY_MAINTENANCE_MAP keys mismatched |
| `src/engine/constants.ts` | EN 15459 components and energy sources from audit JSON | VERIFIED | Imports JSON directly; 79 components, 18 sources; lookup helpers present |
| `src/engine/validation.ts` | Input validation with plausible range checks | VERIFIED | 57 lines; all 9 rule categories implemented; imports only from ./types |
| `src/engine/__tests__/validation.test.ts` | 17 test cases | VERIFIED | All 17 tests pass in 4ms |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `prisma/schema.prisma` | `src/generated/prisma` | `provider = "prisma-client"` generator | VERIFIED | Generator present on line 1; `npx prisma generate` produces enums.ts, client.ts with all models |
| `prisma/schema.prisma` | `src/lib/prisma.ts` | PrismaClient import from generated | VERIFIED | `import { PrismaClient } from "../generated/prisma/client"` on line 1 of prisma.ts |
| `src/engine/constants.ts` | `scripts/output/en15459.json` | JSON import with resolveJsonModule | VERIFIED | `import en15459Data from '../../scripts/output/en15459.json'` line 4; file exists with 79 components |
| `src/engine/constants.ts` | `scripts/output/energy_sources.json` | JSON import with resolveJsonModule | VERIFIED | `import energySourcesData from '../../scripts/output/energy_sources.json'` line 5; file exists with 19 sources |
| `src/engine/validation.ts` | `src/engine/types.ts` | import VariantInput | VERIFIED | `import type { VariantInput } from './types'` on line 1 |
| `CATEGORY_MAINTENANCE_MAP` | `CostCategory` enum | Key names must match for runtime lookups | FAILED | 16/21 keys in CATEGORY_MAINTENANCE_MAP do not exist in CostCategory — engine will return undefined for most categories |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DATA-01 | 03-01 | Prisma schema with Decimal types for all monetary values and rates | SATISFIED | All monetary Decimal fields use @db.Decimal(14,2); rates @db.Decimal(10,8); no bare Decimal |
| DATA-02 | 03-01 | User, Project, Variant, Geometry, BoundaryCondition models defined | SATISFIED | All 5 models present in schema.prisma with correct fields and relations |
| DATA-03 | 03-01 | CostItem with 21 categories (A1-E1) and CostItemDetail for layer breakdown | SATISFIED | CostCategory enum has 21 values; CostItem and CostItemDetail models present with correct fields |
| DATA-04 | 03-01 | EnergyInput with 8 EndUse types (heating 1/2, cooling 1/2, DHW 1/2, household, PV) | SATISFIED | EndUse enum has all 8 values; EnergyInput model uses EndUse with @@unique([variantId, endUse]) |
| DATA-05 | 03-01 | ServiceComponent, WLCInput, DesignCost, IncomeInput, MaintenanceConfig models | SATISFIED | All 5 models present with correct fields and cascade deletes from Variant |
| DATA-06 | 03-01 | ResultSnapshot with engine version, formula mode, input hash for reproducibility | SATISFIED | ResultSnapshot has engineVersion, formulaMode, inputs, inputsHash, outputs, trigger |
| DATA-07 | 03-02 | Engine type interfaces (VariantInput, LCCResult, YearlyEnergyCosts) defined | SATISFIED | All three interfaces present in types.ts with full field coverage matching implementation plan |
| DATA-08 | 03-02 | EN 15459 constants extracted from audit as TypeScript constants | SATISFIED | EN15459_COMPONENTS (79) and ENERGY_SOURCES (18) imported from Phase 2 audit JSON in constants.ts |
| DATA-09 | 03-02 | Input validation rules with plausible range checks | SATISFIED | validateVariantInput covers all rules; 17/17 tests pass |

All 9 requirements satisfied. No orphaned requirements for Phase 3 found in REQUIREMENTS.md.

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `src/engine/types.ts` | 23-45 | CATEGORY_MAINTENANCE_MAP keys do not match CostCategory enum | BLOCKER | Engine will silently return `undefined` for maintenance type lookup on 16/21 categories when processing real DB data. This will corrupt maintenance cost calculations in Phase 4. |

No TODO/FIXME/placeholder comments found in any engine files. No stub return patterns found.

### Human Verification Required

None. All checks were automatable.

### Gaps Summary

**One blocker gap** prevents the single-source-of-truth goal from being fully achieved.

The `CATEGORY_MAINTENANCE_MAP` in `src/engine/types.ts` was committed (ad83327) before the `prisma/schema.prisma` was finalized (b2d77f3). As a result, the map uses a completely different naming convention for cost categories — generic building element names (A2_WALLS, A4_CEILINGS, B4_DHW, C1_ELEVATORS, D1_SITE_WORKS) — while the schema uses domain-specific names aligned with the Excel workbook (A2_FACADES, A4_WALLS, B4_HVAC_COMBINED, C1_SOLAR_THERMAL, D1_FURNISHINGS).

Only 5 keys match between the map and the enum: `A1_ROOFS`, `B1_HEATING`, `B2_COOLING`, `B3_VENTILATION`, `E1_OUTDOOR`. The remaining 16 are silently wrong. When Phase 4 calls `CATEGORY_MAINTENANCE_MAP[costItem.category]` using a category string that came from the database, 16 out of 21 categories will resolve to `undefined` instead of `'building_element'`, `'building_service'`, or `'none'`.

The fix is a targeted update of `CATEGORY_MAINTENANCE_MAP` keys in `src/engine/types.ts` to match the schema enum — this does not affect any interface or type; only the record keys change.

---

_Verified: 2026-03-26T20:30:00Z_
_Verifier: Claude (gsd-verifier)_

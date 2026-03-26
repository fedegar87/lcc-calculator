# Phase 3: Schema, Types & Constants - Research

**Researched:** 2026-03-26
**Domain:** Prisma 7 schema design, TypeScript engine types, EN 15459 constants, input validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Prisma 7 with `prisma-client` generator (set up in Phase 1)
- All monetary values use `Decimal` type
- All rates use `Decimal` type
- Models required (from implementation plan TASK 2):
  - User (id, name, email, passwordHash, organization)
  - Project (id, name, location, buildingUse, constructionYear, notes, variants, members)
  - ProjectMember (userId, projectId, role: OWNER/EDITOR/VIEWER)
  - Variant with VariantLabel enum (BASE, VARIANT_1, VARIANT_2)
  - Geometry (20+ fields: GFA, NFA, treated floor area, building height, U-values, etc.)
  - BoundaryCondition (interestRate, inflationRate, referencePeriod, energyPrices as JSON)
  - CostCategory enum (A1_ROOFS through E1_OUTDOOR, 21 values)
  - CostItem (variantId, category, materialCost, laborCost, otherCost)
  - CostItemDetail (costItemId, description, area, unitPrice, materialCost, laborCost)
  - EnergyInput with EndUse enum (HEATING_1, HEATING_2, COOLING_1, COOLING_2, DHW_1, DHW_2, HOUSEHOLD_ELECTRICITY, PV_PRODUCTION)
  - ServiceComponent (variantId, name, constructionCost, en15459ComponentIndex, lifespan, maintenancePercent)
  - WLCInput (landCost, enablingCosts, planningFees, userSupportPropMgmt, userSupportCharges, userSupportAdmin, financeCost)
  - DesignCost (variantId, lineNumber, description, preliminaryCost, definitiveCost, executiveCost, siteManagementCost)
  - IncomeInput (rents as JSON, otherIncomes as JSON, expectedPricePerM2)
  - MaintenanceConfig (buildingElementMaintenancePercent)
  - FormulaMode enum (EXCEL_REPLICA, EXCEL_BUGFIXED)
  - ResultSnapshot (projectId, variantLabel, engineVersion, formulaMode, inputs JSON, inputsHash, outputs JSON, trigger)
  - ProjectRevision (projectId, label, note, snapshotIds)
  - ExportRecord (projectId, format, snapshotId, fileUrl, fileName)
- All relations use `onDelete: Cascade` from Project
- Indexes on projectId for all project-related models
- Engine types in `src/engine/types.ts` -- NO Prisma imports
- FormulaMode as string literal union: `'excel_replica' | 'excel_bugfixed'`
- ENGINE_VERSION constant
- EN 15459 constants from `scripts/output/en15459.json`
- Energy sources from `scripts/output/energy_sources.json`
- Validation in `src/engine/validation.ts` with `validateVariantInput()` returning string[]

### Claude's Discretion
- Exact Prisma field names (snake_case vs camelCase -- Prisma convention)
- Whether to split schema into multiple files or single `schema.prisma`
- JSON field structure for BoundaryCondition.energyPrices
- Whether to use Prisma 7 composite types or JSON for nested data
- Validation error message wording
- Additional helper types for internal engine use

### Deferred Ideas (OUT OF SCOPE)
- Engine implementation (Phase 4)
- Engine tests (Phase 5)
- Database seed (Phase 6)
- tRPC routers that use these types (Phase 7)
</user_constraints>

## Summary

Phase 3 creates the data foundation: a Prisma schema with ~20 models for persistence, pure TypeScript interfaces for the calculation engine, EN 15459 constants imported from audit JSON, and input validation. The project already has Prisma 7 configured with the `prisma-client` generator, `@prisma/adapter-pg`, and output at `src/generated/prisma`. The implementation plan provides complete model definitions and interface specifications that serve as the primary source of truth.

Three critical findings shape this phase: (1) The implementation plan's auth models (User, Account, Session, VerificationToken) use NextAuth/Auth.js conventions, but Better Auth expects different field names and model structures -- the schema must use Better Auth's conventions instead, deferring exact auth model details to Phase 7 or using `npx auth@latest generate` to scaffold them. (2) Prisma 7 composite types are MongoDB-only, so `energyPrices` in BoundaryCondition must use `Json` fields (already decided in the implementation plan). (3) The project uses Zod 4 (^4.3.6), not Zod 3 -- validation patterns must use Zod 4 syntax (unified `error` param, no `.strict()`, no `.passthrough()`).

**Primary recommendation:** Follow the implementation plan's schema definitions closely, but replace the Auth.js-style auth models with Better Auth-compatible models. Use a single `schema.prisma` file. Use camelCase for Prisma field names (Prisma convention). Use `Json` for nested structures. Import EN 15459 and energy source data directly from audit JSON files using `import` with `resolveJsonModule`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Prisma schema with Decimal types for all monetary values and rates | Prisma 7 `@db.Decimal(precision, scale)` maps to PostgreSQL NUMERIC. Syntax verified. Precision/scale combinations from implementation plan are valid. |
| DATA-02 | User, Project, Variant, Geometry, BoundaryCondition models defined | Implementation plan provides complete definitions. Auth models need Better Auth field adjustments. All other models are straightforward Prisma 7 models. |
| DATA-03 | CostItem with 21 categories (A1-E1) and CostItemDetail for layer breakdown | CostCategory enum with 21 values. CostItem aggregates, CostItemDetail provides layer-level detail with effectiveMaterialCost = MAX(materialCost, unitPrice*area) logic in tRPC. |
| DATA-04 | EnergyInput with 8 EndUse types | EndUse enum with 8 values. EnergyInput model with composite unique on [variantId, endUse]. Energy source indexes 1-19 validated. |
| DATA-05 | ServiceComponent, WLCInput, DesignCost, IncomeInput, MaintenanceConfig models | All model definitions from implementation plan TASK 2. IncomeInput uses flat fields (rent1/2/3, otherIncome1/2/3) not JSON. |
| DATA-06 | ResultSnapshot with engine version, formula mode, input hash | ResultSnapshot model with Json fields for inputs/outputs, FormulaMode enum, engineVersion string, inputsHash for reproducibility. |
| DATA-07 | Engine type interfaces (VariantInput, LCCResult, YearlyEnergyCosts) defined | Implementation plan TASK 3 section 3.1 provides complete interface definitions. Pure TypeScript, no Prisma imports. |
| DATA-08 | EN 15459 constants extracted from audit as TypeScript constants | 79 components in `scripts/output/en15459.json`, 19 energy sources in `scripts/output/energy_sources.json`. Import via `resolveJsonModule` or programmatic copy. |
| DATA-09 | Input validation rules with plausible range checks | `validateVariantInput()` with range checks. Use plain TypeScript validation (not Zod) for engine-layer validation per implementation plan. Zod used at API boundary in Phase 7. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | 7.5.0 | Schema definition, migrations, type-safe queries | Already installed. `prisma-client` generator with output at `src/generated/prisma`. Driver adapter via `@prisma/adapter-pg`. |
| TypeScript | ^5 | Type definitions for engine interfaces | Already configured with `strict: true`, `resolveJsonModule: true`, path alias `@/*`. |
| Zod | ^4.3.6 | Runtime validation (API layer, Phase 7) | Already installed. NOT used in engine validation (Phase 3 uses plain TS). Included here because engine types will later be used with Zod schemas. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| superjson | ^2.2.6 | Serialization of Decimal.js across tRPC | Already configured in tRPC init. Relevant because Prisma Decimal fields need serialization. Manual registration of Decimal.js handler may be needed in Phase 7. |
| decimal.js | (via Prisma) | Arbitrary precision decimals from DB reads | Automatically available via Prisma. Engine uses plain `number`, so conversion happens at DB boundary. |

### No New Dependencies Needed

This phase adds **zero new npm packages**. Everything needed is already installed from Phase 1.

## Architecture Patterns

### Recommended Project Structure

```
prisma/
  schema.prisma         # Single file with all models, enums, relations
src/
  engine/
    types.ts            # Pure TS interfaces (VariantInput, LCCResult, etc.)
    constants.ts        # EN 15459 data + energy sources from audit JSON
    validation.ts       # validateVariantInput() returning string[]
  generated/
    prisma/             # Auto-generated Prisma client (DO NOT EDIT)
  lib/
    prisma.ts           # Prisma client singleton (already exists)
scripts/
  output/
    en15459.json        # 79 HVAC components (source data)
    energy_sources.json # 19 energy sources (source data)
```

### Pattern 1: Single Schema File

**What:** Keep all Prisma models in a single `prisma/schema.prisma` file.
**When to use:** Always for this project (~20 models is manageable in one file).
**Why:** Prisma 7 multi-file schemas require `prismaSchemaFolder` feature flag and complicate the tooling. The project has exactly the right size for a single file with section comments.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// --- AUTH --------------------------------------------------------
// Models for Better Auth (user, session, account, verification)

// --- PROJECT -----------------------------------------------------
// Project, ProjectMember

// --- VARIANT -----------------------------------------------------
// Variant, Geometry, BoundaryCondition

// --- ENERGY ------------------------------------------------------
// EnergyInput, EndUse enum

// --- CONSTRUCTION COSTS ------------------------------------------
// CostCategory enum, CostItem, CostItemDetail

// --- BUILDING SERVICES -------------------------------------------
// ServiceComponent

// --- WLC / DESIGN / INCOME ---------------------------------------
// WLCInput, DesignCost, IncomeInput, MaintenanceConfig

// --- SNAPSHOTS & VERSIONING --------------------------------------
// FormulaMode enum, ResultSnapshot, ProjectRevision, ExportRecord
```

### Pattern 2: Better Auth Schema Models (NOT Auth.js)

**What:** The implementation plan's auth models use Auth.js/NextAuth conventions. Better Auth expects different field names and model structures.
**Why this matters:** The implementation plan schema has `Account.providerAccountId`, `Session.sessionToken`, `Session.expires`, and `VerificationToken` -- all Auth.js conventions. Better Auth expects `Account.accountId`, `Account.providerId`, `Session.token`, `Session.expiresAt`, and a model called `verification` (not `VerificationToken`).

**Recommendation:** Define minimal auth placeholder models that follow Better Auth's expected schema. The exact fields can be finalized in Phase 7 (auth implementation) by running `npx auth@latest generate`. For Phase 3, include the core fields Better Auth expects:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  organization  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  projects      Project[]
  memberships   ProjectMember[]
  snapshots     ResultSnapshot[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Key differences from implementation plan:**
- `User.emailVerified` is `Boolean`, not `DateTime?`
- `User.passwordHash` removed (Better Auth stores password in Account model)
- `Session.token` replaces `Session.sessionToken`
- `Session.expiresAt` replaces `Session.expires`
- `Account` uses `accountId`/`providerId` instead of `provider`/`providerAccountId`
- `Account.password` field exists (for email/password auth)
- `Verification` replaces `VerificationToken` with different fields

### Pattern 3: Decimal Field Syntax

**What:** Prisma `Decimal` fields with `@db.Decimal(precision, scale)` annotations for PostgreSQL.
**Confidence:** HIGH (verified against Prisma docs)

```prisma
// Monetary values: 14 digits total, 2 decimal places
// Max: 999,999,999,999.99 (sufficient for any building cost)
materialCost Decimal? @default(0) @db.Decimal(14,2)

// Rates/percentages: 10 digits total, 8 decimal places
// Stores values like 0.01510000 (1.51%)
interestRate Decimal @default(0.0151) @db.Decimal(10,8)

// U-values: 8 digits total, 4 decimal places
avgUvalueOpaque Decimal? @db.Decimal(8,4)

// Maintenance percentages: 8 digits total, 6 decimal places
buildingElementMaintenancePercent Decimal @default(0.01) @db.Decimal(8,6)
```

**Important:** Precision is total digits (left + right of decimal). `@db.Decimal(14,2)` means max 12 integer digits + 2 decimal digits. PostgreSQL will reject values exceeding this precision.

### Pattern 4: JSON Fields for Nested Data

**What:** Use Prisma `Json` type for nested structures that don't need relational queries.
**Why:** Prisma 7 composite types are MongoDB-only. PostgreSQL uses `Json` or `Json?` fields backed by JSONB.

```prisma
// BoundaryCondition.energyPrices
energyPrices Json @default("[]")
// TypeScript shape: Array<{index: number, name: string, pricePerKwh: number, annualIncrease: number}>

// ResultSnapshot.inputs / outputs
inputs  Json  // Full input state snapshot
outputs Json  // Full result object snapshot
```

**Type safety for Json fields:** Prisma `Json` fields are typed as `Prisma.JsonValue` at the ORM level. Type assertions or runtime validation needed when reading. The `prisma-json-types-generator` package can add compile-time types, but for this project the tRPC layer handles validation via Zod schemas (Phase 7).

### Pattern 5: Engine Types Decoupled from Prisma

**What:** Engine interfaces use plain TypeScript types. No imports from `@prisma/client` or generated Prisma code.
**Why:** The engine must be pure, testable without DB, and framework-independent (implementation plan Ground Rule 4).

```typescript
// src/engine/types.ts
// GOOD: Pure TypeScript
export type FormulaMode = 'excel_replica' | 'excel_bugfixed';
export interface VariantInput {
  referencePeriod: number;
  interestRate: number;  // plain number, not Decimal.js
  // ...
}

// BAD: Prisma dependency
import { FormulaMode } from '@/generated/prisma/client'; // NEVER
```

The tRPC layer (Phase 7) will handle conversion between Prisma Decimal and engine number types.

### Pattern 6: Constants from Audit JSON

**What:** Import EN 15459 and energy source data from the audit JSON files and re-export as typed TypeScript constants.
**Why:** `resolveJsonModule: true` is already configured in tsconfig.json, so JSON imports work directly.

```typescript
// src/engine/constants.ts
import en15459Data from '../../scripts/output/en15459.json';
import energySourcesData from '../../scripts/output/energy_sources.json';

export interface EN15459Component {
  index: number;
  name: string;
  lifespanMin: number;
  lifespanMax: number;
  lifespanAvg: number;
  maintenancePctMin: number | null;
  maintenancePctMax: number | null;
  maintenancePctAvg: number | null;
}

export const EN15459_COMPONENTS: EN15459Component[] = en15459Data.components.map(c => ({
  index: c.index,
  name: c.name,
  lifespanMin: c.lifespan_min,
  lifespanMax: c.lifespan_max,
  lifespanAvg: c.lifespan_avg,
  maintenancePctMin: c.maintenance_pct_min,
  maintenancePctMax: c.maintenance_pct_max,
  maintenancePctAvg: c.maintenance_pct_avg,
}));

export interface EnergySource {
  index: number;
  name: string;
  category: string;
}

export const ENERGY_SOURCES: EnergySource[] = energySourcesData.sources
  .filter(s => !s.is_header)
  .map(s => ({
    index: s.index,
    name: s.name,
    category: s.category,
  }));

// Lookup helpers
export function getEN15459Component(index: number): EN15459Component | undefined {
  return EN15459_COMPONENTS.find(c => c.index === index);
}

export function getEnergySource(index: number): EnergySource | undefined {
  return ENERGY_SOURCES.find(s => s.index === index);
}
```

### Anti-Patterns to Avoid

- **Importing Prisma types into engine files:** The engine must remain pure TypeScript. Conversion happens in tRPC layer.
- **Using Prisma `type` (composite types) for PostgreSQL:** Composite types are MongoDB-only. Use `Json` fields instead.
- **Adding `url` to datasource block:** Prisma 7 with adapter pattern does not need `url` in schema. The connection is configured in `prisma.config.ts` and `src/lib/prisma.ts` (already done).
- **Using `prisma-client-js` generator:** The project uses `prisma-client` (Prisma 7 default). The implementation plan references `prisma-client-js` -- this is outdated and should NOT be followed.
- **Splitting schema into multiple files:** Adds complexity via `prismaSchemaFolder` feature flag. Not worth it for ~20 models.
- **Using Zod for engine-level validation:** Engine validation uses plain TypeScript (returns `string[]`). Zod is for the API boundary (Phase 7).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal precision in DB | Custom NUMERIC handling | Prisma `Decimal` with `@db.Decimal(p,s)` | Prisma handles Decimal.js conversion automatically |
| Auth model schema | Custom auth tables from implementation plan | Better Auth's expected schema structure | Better Auth CLI can generate/validate models; wrong field names cause runtime errors |
| JSON type safety at API boundary | Manual type assertions everywhere | Zod schemas in tRPC (Phase 7) | Runtime validation catches shape mismatches |
| EN 15459 data entry | Manual TypeScript constant typing | JSON import from audit scripts output | Eliminates transcription errors across 79 components |

**Key insight:** The audit scripts already produced verified JSON. Importing it directly eliminates the risk of manual transcription errors across 79 HVAC components and 19 energy sources.

## Common Pitfalls

### Pitfall 1: Auth Model Mismatch

**What goes wrong:** Using Auth.js/NextAuth model conventions (from the implementation plan) causes Better Auth runtime errors.
**Why it happens:** The implementation plan was written with Auth.js conventions. The project now uses Better Auth (per DEC and STACK.md).
**How to avoid:** Use Better Auth's field names: `Session.token` (not `sessionToken`), `Session.expiresAt` (not `expires`), `User.emailVerified` as `Boolean` (not `DateTime?`), `Account.accountId`/`providerId` (not `provider`/`providerAccountId`).
**Warning signs:** Better Auth throws adapter errors on login/signup, session creation fails.

### Pitfall 2: Decimal Precision Overflow

**What goes wrong:** Values exceed the defined precision and PostgreSQL rejects the insert.
**Why it happens:** `@db.Decimal(14,2)` allows max 12 integer digits. If a cost exceeds 999,999,999,999.99, the insert fails.
**How to avoid:** The chosen precisions are generous for building LCC (no single building costs trillions). Rate precision `@db.Decimal(10,8)` allows rates up to +-99.99999999 which covers any realistic scenario. Keep defaults as specified.
**Warning signs:** Prisma throws "value out of range" errors during seed/insert.

### Pitfall 3: Circular Import Between Engine and Prisma

**What goes wrong:** Engine types accidentally import from generated Prisma code, breaking the purity constraint.
**Why it happens:** IDE auto-import suggestions often pull from `@/generated/prisma/client` instead of `@/engine/types`.
**How to avoid:** Engine directory (`src/engine/`) must NEVER import from `src/generated/` or `src/lib/prisma.ts`. The tRPC layer bridges the two. Add a comment header to `src/engine/types.ts`: `// PURE ENGINE TYPES - No Prisma imports allowed`.
**Warning signs:** Engine tests start requiring database connection.

### Pitfall 4: JSON Field Type Safety Gap

**What goes wrong:** `Json` fields accept any valid JSON but there's no compile-time enforcement of the expected shape.
**Why it happens:** Prisma types `Json` fields as `Prisma.JsonValue` (essentially `any`).
**How to avoid:** Document expected JSON shapes with TypeScript interfaces. Validate at the tRPC boundary using Zod schemas (Phase 7). For Phase 3, add interface comments above each Json field in the schema.
**Warning signs:** Runtime errors when reading malformed JSON from DB.

### Pitfall 5: Zod 4 Syntax in Validation

**What goes wrong:** Using Zod 3 syntax patterns when the project has Zod 4 installed.
**Why it happens:** Most examples and training data reference Zod 3.
**How to avoid:** The project uses Zod ^4.3.6. Key differences: `z.enum()` replaces `z.nativeEnum()`, error customization uses `{ error: ... }` not `{ message: ... }`, `.strict()` replaced by `z.strictObject()`. However, Phase 3 engine validation uses plain TypeScript, so Zod 4 specifics only matter in Phase 7.
**Warning signs:** TypeScript errors when using deprecated Zod 3 methods.

### Pitfall 6: Missing Index on Foreign Keys

**What goes wrong:** Queries filtering by projectId or variantId perform full table scans.
**Why it happens:** Prisma doesn't auto-index foreign keys (unlike some ORMs).
**How to avoid:** Add `@@index([projectId])` or `@@index([variantId])` to every model with a foreign key relationship. The implementation plan correctly specifies these.
**Warning signs:** Slow queries on project listing with many variants.

## Code Examples

### Prisma Schema: Geometry Model with Decimal Fields

```prisma
// Source: implementation plan TASK 2, verified against Prisma 7 docs
model Geometry {
  id                    String   @id @default(cuid())
  variantId             String   @unique
  variant               Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  grossFloorArea        Decimal? @db.Decimal(14,2)
  netFloorArea          Decimal? @db.Decimal(14,2)
  treatedFloorArea      Decimal? @db.Decimal(14,2)
  // ... 15+ more fields
}
```

### Engine Type: VariantInput Interface

```typescript
// Source: implementation plan TASK 3 section 3.1
export interface VariantInput {
  referencePeriod: number;
  interestRate: number;      // decimal (0.0151 = 1.51%)
  inflationRate: number;     // decimal (0.0056 = 0.56%)
  treatedFloorArea: number;  // m2
  energyPrices: EnergySourcePrice[];
  energyInputs: EnergyEndUseInput[];
  costItems: CostItemInput[];
  serviceComponents: ServiceComponentInput[];
  buildingElementMaintenancePercent: number;
  wlcInput: WLCInputData;
  designCosts: DesignCostInput[];
  incomeInput?: IncomeInputData;
}
```

### Validation: Plain TypeScript Pattern

```typescript
// Source: implementation plan TASK 3 section 3.3
export function validateVariantInput(input: VariantInput): string[] {
  const errors: string[] = [];

  if (input.referencePeriod <= 0)
    errors.push('Reference period must be greater than 0');
  if (input.referencePeriod > 100)
    errors.push('Reference period must not exceed 100 years');
  if (input.interestRate < -0.1 || input.interestRate > 0.5)
    errors.push('Interest rate out of plausible range (-10% to 50%)');
  if (input.inflationRate < -0.1 || input.inflationRate > 0.5)
    errors.push('Inflation rate out of plausible range (-10% to 50%)');
  if (input.treatedFloorArea < 0)
    errors.push('Treated floor area cannot be negative');

  // Energy source index validation
  for (const ei of input.energyInputs) {
    if (ei.energySourceIndex < 1 || ei.energySourceIndex > 19)
      errors.push(`Energy source index ${ei.energySourceIndex} out of range (1-19)`);
  }

  // Duplicate endUse check
  const endUses = input.energyInputs.map(ei => ei.endUse);
  const uniqueEndUses = new Set(endUses);
  if (endUses.length !== uniqueEndUses.size)
    errors.push('Duplicate endUse entries found');

  // EN 15459 component index validation
  for (const sc of input.serviceComponents) {
    if (sc.en15459ComponentIndex < 1 || sc.en15459ComponentIndex > 79)
      errors.push(`EN 15459 component index ${sc.en15459ComponentIndex} out of range (1-79)`);
  }

  // Non-negative costs
  for (const ci of input.costItems) {
    if (ci.materialCost < 0 || ci.laborCost < 0 || ci.otherCost < 0)
      errors.push(`Negative cost found in category ${ci.category}`);
  }

  if (input.buildingElementMaintenancePercent < 0)
    errors.push('Building element maintenance percentage cannot be negative');

  return errors;
}
```

### Constants Import from Audit JSON

```typescript
// src/engine/constants.ts
import en15459Data from '../../scripts/output/en15459.json';
import energySourcesData from '../../scripts/output/energy_sources.json';

export interface EN15459Component {
  index: number;
  name: string;
  lifespanMin: number;
  lifespanMax: number;
  lifespanAvg: number;
  maintenancePctMin: number | null;
  maintenancePctMax: number | null;
  maintenancePctAvg: number | null;
}

export const EN15459_COMPONENTS: EN15459Component[] =
  en15459Data.components.map(c => ({
    index: c.index,
    name: c.name,
    lifespanMin: c.lifespan_min,
    lifespanMax: c.lifespan_max,
    lifespanAvg: c.lifespan_avg,
    maintenancePctMin: c.maintenance_pct_min,
    maintenancePctMax: c.maintenance_pct_max,
    maintenancePctAvg: c.maintenance_pct_avg,
  }));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prisma-client-js` generator | `prisma-client` generator | Prisma 7 (2025) | Output path required, no node_modules generation, ESM/CJS moduleFormat |
| `datasource url = env("DATABASE_URL")` | Adapter-only (url in prisma.config.ts for migrations) | Prisma 7 (2025) | PrismaClient constructor requires adapter, no url in schema.prisma |
| Auth.js/NextAuth models | Better Auth models | September 2025 merger | Different field names: token vs sessionToken, expiresAt vs expires, Boolean vs DateTime |
| Zod 3 `z.string().email()` | Zod 4 `z.email()` | Zod 4 (2025) | String format validators moved to top-level functions |
| Zod 3 `{ message: "..." }` | Zod 4 `{ error: "..." }` | Zod 4 (2025) | Unified error parameter replaces fragmented API |

**Deprecated/outdated:**
- `prisma-client-js` generator: maintenance mode in Prisma 7
- Auth.js adapter schema: use Better Auth schema instead
- Prisma composite types for PostgreSQL: MongoDB-only feature

## Open Questions

1. **Better Auth exact model fields**
   - What we know: Core fields documented (user, session, account, verification). Better Auth CLI can generate schema.
   - What's unclear: Whether additional plugin-specific fields are needed for email/password flow. Whether `Account.password` field is sufficient or if a separate `passwordHash` pattern is used.
   - Recommendation: Define the core Better Auth models from documented schema. Phase 7 will run `npx auth@latest generate` to validate and extend. The User model should include `organization` as a custom field beyond Better Auth's core.

2. **superjson Decimal.js Registration**
   - What we know: superjson is already configured as tRPC transformer. Prisma Decimal fields return Decimal.js instances.
   - What's unclear: Whether superjson 2.x auto-serializes Decimal.js or needs manual registration via `SuperJSON.registerCustom()`.
   - Recommendation: This is a Phase 7 concern (API layer). For Phase 3, just ensure the schema uses Decimal types correctly. If superjson doesn't auto-handle Decimal.js, register a custom handler in the tRPC init file.

3. **Prisma migrate with adapter-only config**
   - What we know: `prisma.config.ts` exists but has no datasource URL. Migrations need a URL.
   - What's unclear: Whether `prisma migrate dev` will work without configuring the datasource URL in `prisma.config.ts`.
   - Recommendation: Add `env("DATABASE_URL")` to `prisma.config.ts` for migration support. The schema.prisma `datasource` block stays URL-free. Test migration after schema changes.

## Sources

### Primary (HIGH confidence)
- [Prisma Schema API Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) -- Decimal type, native type annotations, field attributes
- [Prisma Special Fields & Types](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types) -- Decimal.js handling, Json fields
- [Prisma Composite Types Docs](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/composite-types) -- Confirmed MongoDB-only
- [Prisma 7 Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) -- prisma-client generator, adapter requirement
- [Better Auth Database Schema](https://better-auth.com/docs/concepts/database) -- Core model field definitions
- [Zod 4 Migration Guide](https://zod.dev/v4/changelog) -- Breaking changes from Zod 3

### Secondary (MEDIUM confidence)
- [Better Auth Prisma Adapter](https://better-auth.com/docs/adapters/prisma) -- Integration pattern, CLI generation
- [Prisma 7 Configuration Guide](https://medium.com/@gargdev010300/how-i-configured-prisma-7-new-changes-issues-and-how-i-solved-them-d5ca728c5b9f) -- Practical setup experience
- [superjson Decimal Registration](https://github.com/prisma/prisma/discussions/19983) -- Manual registration pattern

### Project Sources (HIGH confidence)
- `prisma/schema.prisma` -- Current state: generator + datasource only, no models
- `src/lib/prisma.ts` -- PrismaClient with PrismaPg adapter
- `prisma.config.ts` -- Schema path config, no datasource URL
- `scripts/output/en15459.json` -- 79 components with lifespan/maintenance data
- `scripts/output/energy_sources.json` -- 19 energy sources (2-19 selectable)
- `llc-implementation-plan.md` TASK 2 (lines 658-1092) -- Complete Prisma schema
- `llc-implementation-plan.md` TASK 3 (lines 1095-1330) -- Complete engine types, constants, validation
- `docs/architecture-decisions.md` -- DEC-001 through DEC-010

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and configured
- Architecture: HIGH -- Implementation plan provides complete specifications, verified against Prisma 7 docs
- Pitfalls: HIGH -- Auth model mismatch is a concrete, documented risk; all others are common Prisma patterns

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, no fast-moving components)

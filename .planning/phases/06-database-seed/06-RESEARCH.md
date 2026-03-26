# Phase 6: Database Seed - Research

**Researched:** 2026-03-26
**Domain:** Prisma 7 seeding, Better Auth password hashing, realistic LCC demo data
**Confidence:** HIGH

## Summary

Phase 6 creates a Prisma seed script (`prisma/seed.ts`) that populates the database with a demo user and a fully populated LCC project with 3 variants. The core technical challenges are: (1) hashing the demo user's password using Better Auth's `hashPassword` export from `better-auth/crypto`, (2) configuring `prisma.config.ts` with the `migrations.seed` field to point to `tsx prisma/seed.ts`, and (3) structuring the seed data to match the golden test fixture (`tests/fixtures/excel-reference.json`) for the BASE variant while creating meaningful variations for VARIANT_1 and VARIANT_2.

The project already has all the infrastructure needed: `tsx` (v4.21.0) as dev dependency, `@prisma/adapter-pg` with `PrismaPg` for driver adapter initialization, and the golden fixture with exact values for boundary conditions, energy inputs, cost items, service components, WLC, design costs, and income. The seed script should use `upsert` for the demo user (idempotency) and `deleteMany`+`create` for project data to ensure clean re-seeding.

**Primary recommendation:** Import `hashPassword` from `better-auth/crypto` (verified export: `(password: string) => Promise<string>`), use Prisma's `upsert` for the demo user, and `create` with nested writes for the project/variant hierarchy. Align BASE variant data with the golden fixture for consistency.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Demo user: `demo@lcczero.dev`, password `demo123`, hashed via Better Auth
- Demo project: "CRAVEzero Reference Building", 3 variants (BASE, VARIANT_1, VARIANT_2)
- ProjectMember with OWNER role linking demo user
- Geometry per variant: GFA=2000m2, NFA=1800m2, treated=1750m2 (from Excel tutorial), variants may differ slightly
- Boundary conditions: interest rate 1.51%, inflation 0.56%, reference period 40 years
- Energy prices for Natural Gas, Electricity, PV
- Energy inputs: Heating 1+2, cooling, DHW, household electricity, PV production
- Cost items: at least one per category A1-E1 with realistic values
- Service components: 3-5 HVAC with EN 15459 indexes
- WLC: land cost, enabling costs, planning fees, user support, finance cost
- Design costs: 5-10 professional expert lines
- Income: 1 rent stream for residential
- Maintenance config: 1% for building elements

### Claude's Discretion
- Exact data values for VARIANT_1 and VARIANT_2 (must differ from BASE for meaningful comparison)
- How to hash password (Better Auth utility or bcrypt directly)
- Whether to use Prisma's native seed mechanism or custom script
- Error handling in seed script (idempotency)

### Deferred Ideas (OUT OF SCOPE)
None -- PRD covers phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEED-01 | Demo user with hashed password | Better Auth exports `hashPassword` from `better-auth/crypto` (scrypt, N=16384, r=16, p=1, dkLen=64). Password stored in Account.password field. User created via `upsert` on email, Account created with `providerId: "credential"`, `accountId: userId`. |
| SEED-02 | Demo project with 3 variants and realistic data matching Excel tutorial | Golden fixture (`tests/fixtures/excel-reference.json`) provides exact BASE values. Variant hierarchy via Prisma nested `create`. Schema supports `@@unique([projectId, label])` for variant uniqueness. |
| SEED-03 | Complete data coverage: geometry, boundary conditions, energy, costs, services, WLC, income | Schema defines 10 data models per variant (Geometry, BoundaryCondition, EnergyInput, CostItem, CostItemDetail, ServiceComponent, WLCInput, DesignCost, IncomeInput, MaintenanceConfig). All have verified types and relationships in `prisma/schema.prisma`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma (CLI) | ^7.5.0 | `npx prisma db seed` triggers seed script | Native Prisma seeding mechanism |
| @prisma/adapter-pg | ^7.5.0 | PrismaPg driver adapter for PrismaClient | Required by Prisma 7 (no datasource url in schema) |
| better-auth | ^1.5.6 | `hashPassword` from `better-auth/crypto` | Native hash function ensures compatibility with auth login flow |
| tsx | ^4.21.0 | TypeScript execution for seed script | Already in devDependencies, used by Prisma seed command |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PrismaClient (generated) | ^7.5.0 | ORM for all database operations in seed | Type-safe inserts matching schema.prisma |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `hashPassword` from better-auth/crypto | Node.js `crypto.scrypt` manually | Would need to replicate exact scrypt params (N=16384, r=16, p=1, dkLen=64) and `salt:hash` format. Using better-auth's export guarantees format compatibility. |
| Prisma nested `create` | `createMany` for bulk inserts | `createMany` is faster but doesn't support nested relations. Since we need Variant->Geometry->... hierarchy, nested create is correct. |
| `deleteMany` + `create` for project data | `upsert` for all records | `upsert` requires unique identifiers; seed uses CUIDs which change each run. Delete+create is simpler for demo data. |

**Installation:**
No new dependencies needed. All required packages are already installed.

## Architecture Patterns

### Recommended Project Structure
```
prisma/
  seed.ts              # Main seed script entry point
  seed-data/
    base-variant.ts    # BASE variant data (aligned with golden fixture)
    variant-1.ts       # VARIANT_1 data (improved building)
    variant-2.ts       # VARIANT_2 data (budget-conscious)
    shared.ts          # Shared constants (demo user, project metadata, boundary conditions)
```

### Pattern 1: Better Auth User + Account Creation
**What:** Better Auth stores passwords in the `Account` model (not `User`), with `providerId: "credential"` and `accountId` set to the user's ID. The `password` field contains the scrypt hash in `salt:hash` hex format.
**When to use:** Any time you create users programmatically outside the Better Auth signup flow.
**Example:**
```typescript
// Source: better-auth/dist/crypto/password.mjs (verified in node_modules)
import { hashPassword } from 'better-auth/crypto';

const hashedPassword = await hashPassword('demo123');
// Returns: "hexsalt:hexhash" (32-byte salt + 64-byte scrypt output)

const user = await prisma.user.upsert({
  where: { email: 'demo@lcczero.dev' },
  update: {},
  create: {
    name: 'Demo User',
    email: 'demo@lcczero.dev',
    emailVerified: true,
    accounts: {
      create: {
        providerId: 'credential',
        accountId: '', // Set after user creation, or use a two-step process
        password: hashedPassword,
      },
    },
  },
});

// Account.accountId must equal user.id for Better Auth credential login
await prisma.account.updateMany({
  where: { userId: user.id, providerId: 'credential' },
  data: { accountId: user.id },
});
```

### Pattern 2: Seed Script Entry Point with PrismaPg
**What:** Seed script must initialize PrismaClient with PrismaPg adapter (Prisma 7 requirement -- no datasource url in schema).
**When to use:** The seed script entry point.
**Example:**
```typescript
// Source: Prisma 7 seeding docs + project's src/lib/prisma.ts pattern
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // ... seed logic
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Pattern 3: Idempotent Seed with Delete-then-Create
**What:** For demo data that doesn't need preservation, delete existing demo project then recreate. Use `upsert` only for the user (which persists across re-seeds).
**When to use:** The demo project data can be fully replaced each seed run.
**Example:**
```typescript
// Delete existing demo project (cascade deletes variants, costs, etc.)
await prisma.project.deleteMany({
  where: { name: 'CRAVEzero Reference Building', userId: user.id },
});

// Create project with nested variant hierarchy
const project = await prisma.project.create({
  data: {
    name: 'CRAVEzero Reference Building',
    userId: user.id,
    buildingUse: 'RESIDENTIAL_MULTI',
    country: 'Austria',
    city: 'Innsbruck',
    constructionYear: 2020,
    members: {
      create: { userId: user.id, role: 'OWNER' },
    },
    variants: {
      create: [
        { label: 'BASE', description: 'Reference design', /* nested data */ },
        { label: 'VARIANT_1', description: 'Improved envelope', /* nested data */ },
        { label: 'VARIANT_2', description: 'Budget-conscious', /* nested data */ },
      ],
    },
  },
});
```

### Pattern 4: Golden Fixture Alignment for BASE Variant
**What:** BASE variant seed data matches the golden test fixture values exactly, ensuring calculation results are verifiable.
**When to use:** BASE variant data definition.
**Key values from `tests/fixtures/excel-reference.json`:**
```typescript
// Boundary conditions (shared across variants or per-variant)
const boundaryConditions = {
  referencePeriod: 40,
  interestRate: 0.0151,  // Decimal in Prisma
  inflationRate: 0.0056, // Decimal in Prisma
  energyPrices: [
    { index: 3, name: 'Natural Gas', pricePerKwh: 0.065, annualIncrease: 0.02 },
    { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.22, annualIncrease: 0.025 },
    { index: 13, name: 'Electricity from Photovoltaics', pricePerKwh: 0.12, annualIncrease: 0.015 },
  ],
};

// Energy inputs
const baseEnergyInputs = [
  { endUse: 'HEATING_1', energySourceIndex: 3, specificConsumption: 25 },
  { endUse: 'HEATING_2', energySourceIndex: 3, specificConsumption: 10 },
  { endUse: 'COOLING_1', energySourceIndex: 12, specificConsumption: 15 },
  { endUse: 'HOUSEHOLD_ELECTRICITY', energySourceIndex: 12, specificConsumption: 20 },
  { endUse: 'PV_PRODUCTION', energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 8 },
];

// Cost items (pre-aggregated at CostItem level -- no CostItemDetail needed for seed)
const baseCostItems = [
  { category: 'A1_ROOFS', materialCostAgg: 120000, laborCostAgg: 80000, otherCostAgg: 5000 },
  { category: 'A5_WINDOWS', materialCostAgg: 90000, laborCostAgg: 60000, otherCostAgg: 3000 },
  { category: 'B1_HEATING', materialCostAgg: 45000, laborCostAgg: 25000, otherCostAgg: 2000 },
];

// Service components (EN 15459 indexes: 6=Boiler condensing, 1=Air conditioning units)
const baseServiceComponents = [
  { name: 'Heat pump', constructionCost: 35000, en15459ComponentIndex: 6 },
  { name: 'Ventilation unit', constructionCost: 18000, en15459ComponentIndex: 1 },
];
```

### Anti-Patterns to Avoid
- **Hardcoding CUIDs in seed data:** Let Prisma generate IDs via `@default(cuid())`. Never reference IDs across seed files; use nested creates or query after creation.
- **Using `createMany` for relational data:** `createMany` doesn't support nested relations. Use `create` with nested writes for the variant hierarchy.
- **Skipping Account creation:** Better Auth requires an Account record with `providerId: "credential"` for email/password login. Creating only a User record will make login fail silently.
- **Using `process.env.DATABASE_URL` without validation:** Seed script should fail fast if `DATABASE_URL` is not set, not silently connect to wrong database.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom scrypt implementation | `hashPassword` from `better-auth/crypto` | Must produce exact `salt:hash` format that `verifyPassword` expects during login. Parameters: N=16384, r=16, p=1, dkLen=64. |
| Prisma seed orchestration | Custom npm script or ts-node runner | `prisma.config.ts` `migrations.seed` + `npx prisma db seed` | Prisma 7 native mechanism, integrates with migration workflow. |
| Decimal handling | Manual string conversion | Prisma auto-converts `number` to `Decimal` on create | Prisma handles Decimal(14,2) fields transparently when you pass numbers. |

**Key insight:** The password hash format is the critical interop boundary. Using Better Auth's own `hashPassword` guarantees the seed user can log in via Better Auth's credential provider without format mismatches.

## Common Pitfalls

### Pitfall 1: Missing Account Record for Better Auth
**What goes wrong:** User is created in DB but login fails with "invalid credentials" because Better Auth looks up credentials via the Account table (`providerId: "credential"`), not the User table.
**Why it happens:** Better Auth's architecture separates identity (User) from credentials (Account). The password field is on Account, not User.
**How to avoid:** Always create both User and Account records. Account needs: `providerId: "credential"`, `accountId: userId`, `password: hashedPassword`.
**Warning signs:** Login returns 401 despite correct email/password; Account table is empty.

### Pitfall 2: prisma.config.ts Field Name
**What goes wrong:** `npx prisma db seed` says "No seed command found" even though you configured it.
**Why it happens:** The current `prisma.config.ts` uses `migrate` (legacy field). Prisma 7 expects `migrations` (with an 's') containing the `seed` property.
**How to avoid:** Use the correct field path: `migrations: { seed: "npx tsx prisma/seed.ts" }`. The current config needs updating.
**Warning signs:** `npx prisma db seed` produces no output or an error about missing seed config.

### Pitfall 3: PrismaPg Initialization in Seed Script
**What goes wrong:** Seed script fails with "PrismaClient must be initialized with a driver adapter" or connection errors.
**Why it happens:** Prisma 7 removed `datasource.url` from `schema.prisma` (DEC-014). PrismaClient requires a PrismaPg adapter at instantiation.
**How to avoid:** Create PrismaPg adapter with `{ connectionString: process.env.DATABASE_URL }` and pass to `new PrismaClient({ adapter })`. Follow the pattern in `src/lib/prisma.ts`.
**Warning signs:** Runtime error mentioning "driver adapter" or "no datasource url".

### Pitfall 4: EnergyInput PV Production Field Mismatch
**What goes wrong:** PV production data is lost or zero in calculations after seeding.
**Why it happens:** The golden fixture uses `specificConsumption: 8` for PV_PRODUCTION, but the schema has `pvProductionKwh` as a separate field. The engine type uses `pvProductionKwh` only for PV. Need to check which field the tRPC layer reads.
**How to avoid:** For PV_PRODUCTION end-use, set `pvProductionKwh` (the kWh value that maps to the golden fixture's 8 kWh/m2 * TFA). Check the engine's `EnergyEndUseInput` interface: it uses `specificConsumption` for regular end-uses and `pvProductionKwh` for PV.
**Warning signs:** PV production shows as 0 in results despite seed data.

### Pitfall 5: Decimal Precision in Seed Data
**What goes wrong:** Values lose precision or fail validation when inserted.
**Why it happens:** Prisma Decimal fields have defined precision (e.g., `Decimal(10, 8)` for rates). Passing too many decimal places causes silent truncation; passing numbers Prisma can't convert causes errors.
**How to avoid:** Match the precision defined in schema.prisma. Rates use `Decimal(10, 8)`, monetary values use `Decimal(14, 2)`. Pass plain numbers -- Prisma handles conversion.
**Warning signs:** Assertion errors in tests comparing seed data to fixture; rates showing as 0.02 instead of 0.0151.

## Code Examples

Verified patterns from project source and official documentation:

### Seed Script prisma.config.ts Update
```typescript
// Source: @prisma/config/dist/index.d.ts (verified: migrations.seed is the correct field)
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  migrate: {
    async url() {
      return process.env.DATABASE_URL!;
    },
  },
});
```

### Password Hashing with Better Auth
```typescript
// Source: better-auth/dist/crypto/password.d.mts (verified export)
import { hashPassword } from 'better-auth/crypto';

// hashPassword: (password: string) => Promise<string>
// Returns format: "hexsalt:hexhash"
// Uses: scrypt with N=16384, r=16, p=1, dkLen=64
const hashed = await hashPassword('demo123');
```

### Complete User + Account Creation
```typescript
// Source: prisma/schema.prisma Account model + Better Auth credential provider convention
const hashedPassword = await hashPassword('demo123');

const user = await prisma.user.upsert({
  where: { email: 'demo@lcczero.dev' },
  update: { name: 'Demo User' },
  create: {
    name: 'Demo User',
    email: 'demo@lcczero.dev',
    emailVerified: true,
  },
});

await prisma.account.upsert({
  where: {
    // Account doesn't have @@unique on [userId, providerId], so use a different approach
    id: `seed-account-${user.id}`,
  },
  update: { password: hashedPassword },
  create: {
    id: `seed-account-${user.id}`,
    userId: user.id,
    providerId: 'credential',
    accountId: user.id,
    password: hashedPassword,
  },
});
```

### Variant Data with Nested Creates
```typescript
// Source: prisma/schema.prisma relations
const project = await prisma.project.create({
  data: {
    name: 'CRAVEzero Reference Building',
    userId: user.id,
    buildingUse: 'RESIDENTIAL_MULTI',
    members: { create: { userId: user.id, role: 'OWNER' } },
    variants: {
      create: [
        {
          label: 'BASE',
          description: 'Reference design matching Excel tutorial',
          geometry: {
            create: {
              grossFloorArea: 2000,
              netFloorArea: 1800,
              treatedFloorArea: 1750,
            },
          },
          boundaryCondition: {
            create: {
              referencePeriod: 40,
              interestRate: 0.0151,
              inflationRate: 0.0056,
              energyPrices: [
                { index: 3, name: 'Natural Gas', pricePerKwh: 0.065, annualIncrease: 0.02 },
                { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.22, annualIncrease: 0.025 },
                { index: 13, name: 'Electricity from Photovoltaics', pricePerKwh: 0.12, annualIncrease: 0.015 },
              ],
            },
          },
          energyInputs: {
            create: [
              { endUse: 'HEATING_1', energySourceIndex: 3, specificConsumption: 25 },
              { endUse: 'HEATING_2', energySourceIndex: 3, specificConsumption: 10 },
              { endUse: 'COOLING_1', energySourceIndex: 12, specificConsumption: 15 },
              { endUse: 'HOUSEHOLD_ELECTRICITY', energySourceIndex: 12, specificConsumption: 20 },
              { endUse: 'PV_PRODUCTION', energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 14000 },
            ],
          },
          // ... costItems, serviceComponents, wlcInput, designCosts, incomeInput, maintenanceConfig
        },
      ],
    },
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prisma.seed` in `package.json` | `migrations.seed` in `prisma.config.ts` | Prisma 6.6+ / 7.0 | Seed config moved to TypeScript config file |
| Auto-seed on `prisma migrate dev` | Explicit `npx prisma db seed` only | Prisma 7.0 | `--skip-seed` removed; seed is always manual |
| PrismaClient with datasource url | PrismaClient with driver adapter (PrismaPg) | Prisma 7.0 | Seed script must init PrismaPg adapter |
| `pg.Pool` required for PrismaPg | `PrismaPg({ connectionString })` accepts PoolConfig | @prisma/adapter-pg 7.x | No need to explicitly create Pool |

**Deprecated/outdated:**
- `package.json` `prisma.seed` field: Still works as fallback but `prisma.config.ts` takes precedence in Prisma 7
- `--skip-seed` flag on `prisma migrate dev`: Removed in Prisma 7

## Open Questions

1. **Account `@@unique` constraint for upsert**
   - What we know: The Account model has `@@index([userId])` but no `@@unique([userId, providerId])` constraint
   - What's unclear: Whether we can rely on `upsert` with a composite where clause, or need a deterministic ID strategy
   - Recommendation: Use a deterministic seed ID (`seed-account-{userId}`) or use deleteMany+create for the account. Alternatively, check if the account exists first and conditionally create.

2. **PV Production field mapping in seed**
   - What we know: Golden fixture has `"specificConsumption": 8` for PV_PRODUCTION. The engine type `EnergyEndUseInput` has `pvProductionKwh?: number`. The DB schema has both `specificConsumption` and `pvProductionKwh` fields.
   - What's unclear: Whether the 8 in the fixture is kWh/m2 (to be multiplied by TFA in the engine) or absolute kWh. The tRPC layer (Phase 7, not yet built) will handle the mapping.
   - Recommendation: In seed, set `specificConsumption: 8` for PV_PRODUCTION to match golden fixture format. The engine's `buildEnergyInputs` (tRPC) will handle the conversion.

3. **Variant data differentiation strategy**
   - What we know: VARIANT_1 and VARIANT_2 must differ from BASE for meaningful demo comparison
   - What's unclear: Exact values -- this is Claude's discretion per CONTEXT.md
   - Recommendation: VARIANT_1 = improved building (lower heating demand, better windows, higher PV, slightly higher construction cost). VARIANT_2 = budget option (higher energy consumption, cheaper materials, no PV). This creates a realistic 3-way comparison.

## Sources

### Primary (HIGH confidence)
- `better-auth/dist/crypto/password.mjs` -- verified scrypt parameters, hashPassword export, salt:hash format
- `better-auth/dist/crypto/index.d.mts` -- verified `hashPassword` and `verifyPassword` re-exports from `better-auth/crypto`
- `@prisma/config/dist/index.d.ts` -- verified `MigrationsConfigShape.seed` field type and location
- `prisma/schema.prisma` (project) -- all 10+ data models, relations, types, constraints
- `tests/fixtures/excel-reference.json` (project) -- golden fixture with exact BASE variant values
- `src/lib/prisma.ts` (project) -- PrismaPg adapter initialization pattern

### Secondary (MEDIUM confidence)
- [Prisma 7 Seeding Documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding) -- seed workflow, config structure, tsx runner
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference) -- defineConfig, migrations.seed field
- [Better Auth Users & Accounts](https://better-auth.com/docs/concepts/users-accounts) -- Account model relationship, credential storage
- [Better Auth Security](https://better-auth.com/docs/reference/security) -- scrypt algorithm details, custom hash options

### Tertiary (LOW confidence)
- [AnswerOverflow: How to seed users for dev env](https://www.answeroverflow.com/m/1342169727925092436) -- community approach to Better Auth seeding (could not fetch due to rate limit)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, exports verified in node_modules
- Architecture: HIGH -- Prisma schema, golden fixture, and prisma.ts pattern all verified in codebase
- Pitfalls: HIGH -- Account model requirement verified from Better Auth source; PrismaPg requirement verified from Prisma 7 config types

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- Prisma 7 and Better Auth are established)

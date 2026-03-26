# Phase 6: Database Seed - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 6)

<domain>
## Phase Boundary

Phase 6 creates a Prisma seed script that populates the database with realistic demo data. A developer or reviewer can run `npx prisma db seed` and immediately have a working project to explore.

</domain>

<decisions>
## Implementation Decisions

### Demo User
- Email: `demo@lcczero.dev`, password: `demo123` (hashed via Better Auth)
- User must be compatible with Better Auth's user model

### Demo Project
- Name: "CRAVEzero Reference Building"
- 3 variants: BASE, VARIANT_1, VARIANT_2
- ProjectMember with OWNER role linking demo user

### Geometry (per variant)
- GFA=2000m2, NFA=1800m2, treated=1750m2 (from Excel tutorial)
- Variants may differ slightly to demonstrate comparison

### Boundary Conditions
- Interest rate: 1.51%, inflation: 0.56%, reference period: 40 years
- Energy prices for common sources (Natural Gas, Electricity, PV)

### Energy Inputs
- Heating system 1+2, cooling, DHW, household electricity, PV production
- Realistic kWh/m2 values matching Excel tutorial

### Cost Items
- At least one item per category A1-E1 with realistic values
- Material cost, labor cost, other cost per item

### Service Components
- 3-5 HVAC components with EN 15459 indexes
- Realistic construction costs

### WLC Input
- Land cost, enabling costs, planning fees, user support, finance cost

### Design Costs
- 5-10 professional expert lines with preliminary/definitive/executive/site costs

### Income Input
- 1 rent stream for residential

### Maintenance Config
- 1% for building elements

### Claude's Discretion
- Exact data values for VARIANT_1 and VARIANT_2 (must differ from BASE for meaningful comparison)
- How to hash password (Better Auth utility or bcrypt directly)
- Whether to use Prisma's native seed mechanism or custom script
- Error handling in seed script (idempotency)

</decisions>

<specifics>
## Specific Ideas

- Seed data should match the golden test fixture where possible (same rates, areas, energy sources)
- Values should produce meaningful LCC differences between variants for demo purposes
- Use Prisma's `createMany` where available for efficiency
- Script should be idempotent (check if demo user exists before creating)

</specifics>

<deferred>
## Deferred Ideas

None -- PRD covers phase scope

</deferred>

---

*Phase: 06-database-seed*
*Context gathered: 2026-03-26 via PRD Express Path*

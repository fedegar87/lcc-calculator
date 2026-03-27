# Phase 7: tRPC API & Authentication - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Type-safe tRPC API layer exposing all data operations (project CRUD, variant data management, calculation trigger) with email/password authentication via Better Auth. All endpoints are protected — unauthenticated requests return 401. Role-based access control enforces Owner/Editor/Viewer permissions on project resources.

</domain>

<decisions>
## Implementation Decisions

### Role Permissions
- **Viewer**: Read-only access to all project data and results. Cannot trigger calculations or modify anything.
- **Editor**: Can edit all variant data, delete projects, and trigger calculations. Cannot manage project members.
- **Owner**: Full control including member management (add/remove members, assign roles).
- **Project listing**: Shows only projects the user created (own projects). Member-accessible projects require direct navigation.

### Calculation Trigger
- Calculation runs **automatically when navigating to the Results step** — no explicit "Calculate" button needed.
- The API endpoint accepts a variant ID, loads all input data from DB, converts Prisma Decimals to engine numbers, runs `calculateLCC()`, and returns the full `LCCResult`.
- **Default formula mode**: `excel_bugfixed`. Users can switch to `excel_replica` for comparison.

### Data Save Granularity
- **CostItemDetail** rows: Individual CRUD (add/edit/delete single detail rows within a cost item).
- **ServiceComponent** rows: Individual CRUD (add/edit/delete individual HVAC/service components).
- **New project creation**: Starts with BASE variant only. User can add VARIANT_1 and VARIANT_2 later via explicit action.

### Error Responses
- Engine errors: **User-friendly messages only** — hide internal engine error details. Show guidance like "Calculation failed — please check your inputs."
- Error language: **English only** for v1.

### Claude's Discretion
- **Ownership transfer**: Claude decides simplest approach for v1 (likely: creator is always Owner, no transfer).
- **Snapshot storage**: Claude decides when to persist ResultSnapshot (likely: on explicit export/save action, not every auto-calc).
- **Calculation scope**: Claude decides per-variant vs all-variants endpoint (likely: per-variant, client calls multiple times for comparison).
- **Save granularity for sections**: Claude decides per-section vs bulk endpoints for geometry, energy, boundary conditions, WLC, income, etc. (likely: per-section to match wizard steps).
- **Validation detail level**: Claude decides field-level vs general errors (likely: field-level to enable inline form validation in Phase 8).
- **Access denied behavior**: Claude decides 404 vs 403 for unauthorized project access (likely: 404 to not reveal project existence).

</decisions>

<specifics>
## Specific Ideas

- Variant calculations require all input data (construction elements, energy, boundary conditions etc.) — the API must load and assemble the full `VariantInput` from multiple DB tables before calling the engine.
- FormulaMode conversion: Prisma uses SCREAMING_CASE (`EXCEL_REPLICA`, `EXCEL_BUGFIXED`), engine uses lowercase (`excel_replica`, `excel_bugfixed`) — tRPC layer handles conversion.
- The existing `src/engine/validation.ts` validates `VariantInput` — the API should validate at the Zod/tRPC level first (type/range checks), then let the engine validate domain rules.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/trpc/init.ts`: tRPC initialized with superjson transformer, context stub ready for auth injection
- `src/server/trpc/router.ts`: App router with healthcheck — extend with new routers
- `src/lib/prisma.ts`: Prisma client singleton with PrismaPg adapter
- `src/engine/index.ts`: `calculateLCC(input, config)` — pure function, main engine entry point
- `src/engine/types.ts`: `VariantInput`, `LCCResult`, `EngineConfig`, `FormulaMode` types
- `src/engine/validation.ts`: `validateVariantInput()` — engine-level input validation
- `src/engine/constants.ts`: EN 15459 components, energy sources — needed for dropdowns/lookups

### Established Patterns
- tRPC with superjson transformer (handles Date, Decimal serialization)
- Prisma Decimal fields throughout schema — need number conversion for engine
- Better Auth table conventions (User, Session, Account, Verification models already in schema)
- Engine is dependency-free — no Prisma or framework imports

### Integration Points
- `src/server/trpc/init.ts` `createTRPCContext()` — inject auth session here
- `src/server/trpc/router.ts` `appRouter` — merge new routers (auth, project, variant, calculation)
- `src/app/api/trpc/[...trpc]/route.ts` — Next.js API route already configured
- `src/server/trpc/client.tsx` and `server.tsx` — client/server callers ready
- Better Auth needs its own API route handler (e.g., `src/app/api/auth/[...all]/route.ts`)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-trpc-api-authentication*
*Context gathered: 2026-03-27*

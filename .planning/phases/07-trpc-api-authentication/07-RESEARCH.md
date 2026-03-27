# Phase 7: tRPC API & Authentication - Research

**Researched:** 2026-03-27
**Domain:** tRPC v11 + Better Auth + Zod v4 + Prisma 7 integration
**Confidence:** HIGH

## Summary

This phase wires up the complete API layer: Better Auth for email/password authentication, tRPC v11 routers for all data operations, and the calculation engine integration. The existing codebase already has tRPC initialized with superjson, a Prisma client singleton, and the calculation engine as a pure function -- the main work is creating the auth configuration, injecting sessions into tRPC context, building protected procedures, and writing the domain routers (project, variant, cost-item, calculation, reference).

The critical integration point is the tRPC context: it must call `auth.api.getSession({ headers })` and expose the user to all downstream procedures. Prisma Decimal fields must be converted to plain numbers before passing to the engine. Zod v4 schemas validate at the API boundary; the engine's own `validateVariantInput()` handles domain rules.

**Primary recommendation:** Build auth first (Better Auth config + API route + client), then tRPC context with session injection, then routers in dependency order: reference (no auth needed for lookups) -> project -> variant -> cost-item -> calculation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Role Permissions**: Viewer = read-only (no calc trigger); Editor = edit + delete + calc trigger (no member management); Owner = full control including members. Project listing shows only user-created projects.
- **Calculation Trigger**: Auto-calculate on Results step navigation. Endpoint accepts variant ID, loads all input from DB, converts Prisma Decimals, runs `calculateLCC()`, returns full `LCCResult`. Default formula mode: `excel_bugfixed`.
- **Data Save Granularity**: CostItemDetail and ServiceComponent = individual CRUD. New project starts with BASE variant only, user adds VARIANT_1/2 later.
- **Error Responses**: User-friendly messages only (hide engine internals). English only for v1.

### Claude's Discretion
- **Ownership transfer**: Simplest v1 approach (creator is always Owner, no transfer).
- **Snapshot storage**: Persist ResultSnapshot on explicit export/save action, not every auto-calc.
- **Calculation scope**: Per-variant endpoint, client calls multiple times for comparison.
- **Save granularity for sections**: Per-section endpoints to match wizard steps (geometry, energy, boundary conditions, WLC, income, etc.).
- **Validation detail level**: Field-level errors to enable inline form validation in Phase 8.
- **Access denied behavior**: Return 404 (not 403) for unauthorized project access to not reveal project existence.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | tRPC setup with superjson, protected procedures, auth context | tRPC context pattern with `auth.api.getSession()`, middleware-based `protectedProcedure`, superjson already configured |
| API-02 | Project router: list, getById, create, update, delete, addMember, removeMember | Prisma CRUD with role-based middleware, OWNER-only member management, 404 for unauthorized |
| API-03 | Variant router: upsert geometry, boundary conditions, energy, WLC, design costs, income, maintenance | Per-section upsert mutations with Zod v4 input schemas, Decimal field handling |
| API-04 | Cost-item router: listByVariant, upsert, delete, batchUpsert | Individual CRUD for CostItemDetail rows, aggregation recompute on change |
| API-05 | Calculate router: calculate single variant, calculateAll for comparison | Multi-table Prisma load -> Decimal-to-number conversion -> `calculateLCC()` -> return `LCCResult` |
| API-06 | Reference router: EN 15459 components, energy sources, cost categories | Static data from `src/engine/constants.ts`, public procedures (no auth required) |
| API-07 | Export router: PDF and Excel generation with ResultSnapshot creation | Deferred to Phase 9 -- stub router only in this phase |
| AUTH-01 | User can register with name, email, password | Better Auth `emailAndPassword: { enabled: true }` + client `signUp.email()` |
| AUTH-02 | User can log in with email/password and stay logged in | Better Auth `signIn.email()` + session cookie management |
| AUTH-03 | User can log out from any page | Better Auth `signOut()` client method + redirect |
| AUTH-04 | Protected routes redirect unauthenticated users to login | Next.js middleware with `getSessionCookie()` check |
| AUTH-05 | Project access controlled by ProjectMember role | tRPC middleware checks `ProjectMember` table for role before allowing operations |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @trpc/server | ^11.15.0 | Type-safe API server | Already installed, v11 with superjson transformer |
| @trpc/client | ^11.15.0 | Type-safe API client | Already installed, paired with server |
| @trpc/tanstack-react-query | ^11.15.0 | React Query integration | Already installed, provides `useTRPC` hook |
| better-auth | ^1.5.6 | Authentication (email/password) | Already installed, chosen over Auth.js (DEC-017) |
| zod | ^4.3.6 | Input validation schemas | Already installed, v4 with faster parsing |
| superjson | ^2.2.6 | Serialize Date, Decimal, BigInt over wire | Already installed, configured in tRPC init |
| @prisma/client | ^7.5.0 | Database ORM | Already installed, Prisma 7 with PrismaPg adapter |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.95.2 | Server state cache + mutations | Already installed, powers tRPC client-side |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Auth.js v5 | Better Auth chosen for simpler Prisma integration and model conventions (DEC-017) -- locked decision |
| superjson | devalue | superjson already configured and handles Prisma Decimal with custom serializer |

**Installation:**
```bash
# No new packages needed -- all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── auth.ts              # Better Auth server config (NEW)
│   ├── auth-client.ts        # Better Auth React client (NEW)
│   └── prisma.ts             # Prisma client singleton (EXISTS)
├── server/
│   └── trpc/
│       ├── init.ts            # tRPC init + context + procedures (MODIFY)
│       ├── router.ts          # App router merging sub-routers (MODIFY)
│       ├── routers/
│       │   ├── project.ts     # Project CRUD + members (NEW)
│       │   ├── variant.ts     # Variant section upserts (NEW)
│       │   ├── cost-item.ts   # CostItem + CostItemDetail CRUD (NEW)
│       │   ├── calculation.ts # Engine integration (NEW)
│       │   └── reference.ts   # EN 15459 + energy sources (NEW)
│       ├── middleware/
│       │   └── auth.ts        # Role-based access middleware (NEW)
│       ├── client.tsx         # Client provider (EXISTS)
│       ├── server.tsx         # Server caller (EXISTS)
│       └── query-client.ts    # Query client factory (EXISTS)
├── app/
│   └── api/
│       ├── trpc/[...trpc]/route.ts  # tRPC handler (EXISTS)
│       └── auth/[...all]/route.ts   # Better Auth handler (NEW)
└── engine/
    ├── index.ts               # calculateLCC() (EXISTS)
    ├── types.ts               # VariantInput, LCCResult (EXISTS)
    └── constants.ts           # EN 15459, energy sources (EXISTS)
```

### Pattern 1: Better Auth Server Configuration
**What:** Configure Better Auth with Prisma adapter and email/password
**When to use:** Server-side auth initialization
**Example:**
```typescript
// src/lib/auth.ts
// Source: https://better-auth.com/docs/adapters/prisma
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
```

### Pattern 2: tRPC Context with Better Auth Session
**What:** Inject authenticated session into tRPC context
**When to use:** Every tRPC request
**Example:**
```typescript
// src/server/trpc/init.ts (modified)
// Source: https://trpc.io/docs/server/context + https://better-auth.com/docs/integrations/next
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });
  return {
    db: prisma,
    session,
    user: session?.user ?? null,
  };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({ transformer: superjson });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// Protected procedure middleware
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: { ...opts.ctx, user: opts.ctx.user },
  });
});
```

### Pattern 3: Role-Based Project Access Middleware
**What:** Check ProjectMember role before allowing project operations
**When to use:** All project/variant/cost-item/calculation procedures that reference a projectId
**Example:**
```typescript
// src/server/trpc/middleware/auth.ts
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";

type Role = "OWNER" | "EDITOR" | "VIEWER";

export function requireProjectRole(...allowedRoles: Role[]) {
  return async (opts: { ctx: { user: { id: string } }; next: Function; rawInput: unknown }) => {
    const input = opts.rawInput as { projectId?: string };
    if (!input?.projectId) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const membership = await opts.ctx.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: opts.ctx.user.id,
        },
      },
    });

    // Also check if user is the project creator (implicit OWNER)
    if (!membership) {
      const project = await opts.ctx.db.project.findFirst({
        where: { id: input.projectId, userId: opts.ctx.user.id },
      });
      if (!project) {
        // Return NOT_FOUND to hide project existence
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // Creator is implicit OWNER
      if (!allowedRoles.includes("OWNER")) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    } else if (!allowedRoles.includes(membership.role as Role)) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return opts.next({ ctx: opts.ctx });
  };
}
```

### Pattern 4: Prisma Decimal to Engine Number Conversion
**What:** Convert Prisma Decimal fields to plain numbers for the engine
**When to use:** When building VariantInput from Prisma query results
**Example:**
```typescript
// Utility: convert Prisma Decimal | null to number
function d(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

// Building VariantInput from Prisma data:
const variantInput: VariantInput = {
  referencePeriod: bc.referencePeriod,
  interestRate: d(bc.interestRate),
  inflationRate: d(bc.inflationRate),
  treatedFloorArea: d(geometry?.treatedFloorArea),
  energyPrices: (bc.energyPrices as EnergySourcePrice[]),
  energyInputs: energyInputRows.map(row => ({
    endUse: row.endUse,
    energySourceIndex: row.energySourceIndex,
    specificConsumption: d(row.specificConsumption),
    pvProductionKwh: row.pvProductionKwh ? d(row.pvProductionKwh) : undefined,
  })),
  // ... etc
};
```

### Pattern 5: Per-Section Upsert for Wizard Steps
**What:** Each wizard step saves its data independently via a dedicated mutation
**When to use:** Geometry, BoundaryCondition, WLCInput, IncomeInput, MaintenanceConfig (one-to-one with Variant)
**Example:**
```typescript
// variant.ts router
upsertGeometry: protectedProcedure
  .input(z.object({
    variantId: z.string(),
    grossFloorArea: z.number().nullable().optional(),
    netFloorArea: z.number().nullable().optional(),
    treatedFloorArea: z.number().nullable().optional(),
    // ... all geometry fields
  }))
  .mutation(async ({ ctx, input }) => {
    const { variantId, ...data } = input;
    // Verify variant belongs to user's project (via middleware or inline check)
    return ctx.db.geometry.upsert({
      where: { variantId },
      update: data,
      create: { variantId, ...data },
    });
  }),
```

### Pattern 6: Zod v4 Input Schemas
**What:** Define input validation with Zod v4 syntax
**When to use:** All tRPC `.input()` calls
**Example:**
```typescript
// Zod v4: import from "zod" (same as v3)
import { z } from "zod";

// Object schemas work the same
const createProjectInput = z.object({
  name: z.string().min(1).max(200),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  buildingUse: z.enum(["RESIDENTIAL_SINGLE", "RESIDENTIAL_MULTI", "OFFICE",
    "EDUCATION", "COMMERCIAL", "INDUSTRIAL", "OTHER"]).default("RESIDENTIAL_MULTI"),
});

// Zod v4 change: error customization uses `error` param
const emailSchema = z.string().email({ error: "Invalid email address" });

// z.enum() now accepts native TS enums directly (v4 enhancement)
// But for string unions matching Prisma enums, string array form still works fine
```

### Anti-Patterns to Avoid
- **Loading the entire variant graph for listing**: Use `select` to pick only needed fields for project/variant lists. Only load full graph for calculation.
- **Validating Decimal precision in Zod**: Let Prisma handle Decimal precision -- Zod validates logical ranges (non-negative, plausible bounds).
- **Returning Prisma Decimal objects to the client**: Always convert to number before returning. superjson handles Date but Prisma Decimal needs explicit conversion or custom serializer registration.
- **Storing calculation results in DB on every auto-calc**: Per user decision, only persist ResultSnapshot on explicit export/save action.
- **Throwing FORBIDDEN for unauthorized project access**: Per user decision, always throw NOT_FOUND (404) to avoid revealing project existence.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT/cookie handling | Better Auth `emailAndPassword` | Session rotation, CSRF protection, cookie security all handled |
| Password hashing | bcrypt manually | Better Auth built-in (`hashPassword`) | Salt rounds, timing-safe comparison built in |
| tRPC type inference | Manual request/response types | tRPC `inferRouterInputs`/`inferRouterOutputs` | End-to-end type safety is tRPC's core feature |
| Input validation | Manual checks in procedure body | Zod v4 schemas via `.input()` | Runtime + compile-time validation, auto error responses |
| Session in context | Manual cookie parsing | `auth.api.getSession({ headers })` | Handles all edge cases: expired, revoked, malformed |
| Query client dehydration | Manual cache management | `@trpc/tanstack-react-query` | Already set up, handles SSR hydration |

**Key insight:** The entire auth flow (register, login, logout, session validation) is handled by Better Auth with ~20 lines of config. The tRPC integration is just passing headers to `getSession()` in the context factory.

## Common Pitfalls

### Pitfall 1: Prisma Decimal Serialization Failure
**What goes wrong:** tRPC returns Prisma Decimal objects to the client, which either fail to serialize or arrive as strings/objects instead of numbers.
**Why it happens:** Prisma 7 returns `Decimal` type (from decimal.js) for `@db.Decimal()` fields. superjson doesn't natively know how to serialize them.
**How to avoid:** Either (a) register a custom superjson serializer for Decimal, or (b) explicitly convert all Decimal fields to `Number()` before returning from tRPC procedures. Option (b) is simpler and recommended since the engine already works with plain numbers.
**Warning signs:** Client receives `{"s":1,"e":1,"d":[1,5,1]}` instead of `1.51` for a Decimal field.

### Pitfall 2: Better Auth Cookie Not Forwarded in Server Components
**What goes wrong:** `auth.api.getSession()` returns null in Server Components even when the user is logged in.
**Why it happens:** The `headers()` function from `next/headers` must be awaited (Next.js 15 change). Also, the `nextCookies()` plugin must be added to Better Auth config for proper cookie handling in server actions.
**How to avoid:** Always `await headers()` and include `nextCookies()` in the auth plugins array.
**Warning signs:** Session is null on server but the client shows logged-in state.

### Pitfall 3: FormulaMode Enum Mismatch Between Prisma and Engine
**What goes wrong:** Prisma uses `EXCEL_REPLICA` / `EXCEL_BUGFIXED` (SCREAMING_CASE enum), engine uses `excel_replica` / `excel_bugfixed` (lowercase string union).
**Why it happens:** Architecture decision from Phase 3 -- Prisma enums are SCREAMING_CASE by convention, engine types are decoupled.
**How to avoid:** Convert in the tRPC layer: `formulaMode.toLowerCase() as FormulaMode` when building `EngineConfig`, and `formulaMode.toUpperCase()` when storing to Prisma.
**Warning signs:** Engine throws "unknown formula mode" or Prisma rejects the value.

### Pitfall 4: N+1 Queries When Loading Variant Data for Calculation
**What goes wrong:** Loading variant with all related data makes separate queries for each relation.
**Why it happens:** Using multiple `findFirst` calls instead of a single `include` query.
**How to avoid:** Use Prisma `include` to eagerly load all relations in one query:
```typescript
const variant = await prisma.variant.findUnique({
  where: { id: variantId },
  include: {
    geometry: true,
    boundaryCondition: true,
    energyInputs: true,
    costItems: { include: { details: true } },
    serviceComponents: true,
    wlcInput: true,
    designCosts: true,
    incomeInput: true,
    maintenanceConfig: true,
  },
});
```
**Warning signs:** Calculation endpoint is slow; database logs show 10+ separate queries per calculation.

### Pitfall 5: Zod v4 Error Customization API Change
**What goes wrong:** Using `{ message: "..." }` or `{ invalid_type_error: "..." }` from Zod v3 patterns.
**Why it happens:** Zod v4 unified error customization under `{ error: "..." }` or `{ error: (issue) => "..." }`.
**How to avoid:** Use the new `error` param. The old `message` param still works but is deprecated. `invalid_type_error` and `required_error` are removed.
**Warning signs:** TypeScript warnings about deprecated params, or runtime errors if using removed params.

### Pitfall 6: Missing Auth Route Handler
**What goes wrong:** Better Auth signup/login/logout calls fail with 404.
**Why it happens:** The `api/auth/[...all]/route.ts` catch-all route is missing.
**How to avoid:** Create the route file early. It's just 3 lines:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```
**Warning signs:** Network tab shows 404 on `/api/auth/sign-up/email` or similar paths.

## Code Examples

### Better Auth Client Setup
```typescript
// src/lib/auth-client.ts
// Source: https://better-auth.com/docs/basic-usage
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// Usage in components:
// const { data: session, isPending } = authClient.useSession();
// await authClient.signUp.email({ email, password, name });
// await authClient.signIn.email({ email, password });
// await authClient.signOut();
```

### Better Auth API Route
```typescript
// src/app/api/auth/[...all]/route.ts
// Source: https://better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Next.js Middleware for Route Protection
```typescript
// src/middleware.ts
// Source: https://better-auth.com/docs/integrations/next
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/dashboard/:path*"],
};
```

### App Router Merging Sub-Routers
```typescript
// src/server/trpc/router.ts (modified)
// Source: https://trpc.io/docs/server/routers
import { createTRPCRouter } from "./init";
import { projectRouter } from "./routers/project";
import { variantRouter } from "./routers/variant";
import { costItemRouter } from "./routers/cost-item";
import { calculationRouter } from "./routers/calculation";
import { referenceRouter } from "./routers/reference";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  variant: variantRouter,
  costItem: costItemRouter,
  calculation: calculationRouter,
  reference: referenceRouter,
});

export type AppRouter = typeof appRouter;
```

### Calculation Router Integration
```typescript
// src/server/trpc/routers/calculation.ts (sketch)
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { calculateLCC, DEFAULT_ENGINE_CONFIG } from "@/engine";
import type { VariantInput, FormulaMode } from "@/engine";
import { TRPCError } from "@trpc/server";

export const calculationRouter = createTRPCRouter({
  calculate: protectedProcedure
    .input(z.object({
      variantId: z.string(),
      formulaMode: z.enum(["excel_replica", "excel_bugfixed"]).default("excel_bugfixed"),
    }))
    .query(async ({ ctx, input }) => {
      // 1. Load variant with all relations
      const variant = await ctx.db.variant.findUnique({
        where: { id: input.variantId },
        include: {
          project: { select: { id: true, userId: true, members: true } },
          geometry: true,
          boundaryCondition: true,
          energyInputs: true,
          costItems: true,
          serviceComponents: true,
          wlcInput: true,
          designCosts: true,
          incomeInput: true,
          maintenanceConfig: true,
        },
      });

      if (!variant) throw new TRPCError({ code: "NOT_FOUND" });

      // 2. Check access (viewer can't trigger calc per user decision)
      // ... role check middleware

      // 3. Build VariantInput (convert Decimals to numbers)
      const variantInput = buildVariantInput(variant);

      // 4. Run engine
      try {
        const config = { ...DEFAULT_ENGINE_CONFIG, formulaMode: input.formulaMode };
        const result = calculateLCC(variantInput, config);
        return result;
      } catch (err) {
        // User-friendly error only (per user decision)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Calculation failed - please check your inputs.",
        });
      }
    }),
});
```

### CostItem Detail MAX(material, unit*area) Resolution
```typescript
// Per architecture decision: detail MAX(mat, unit*area) resolved in tRPC layer
function resolveDetailCost(detail: CostItemDetail): number {
  const materialCost = d(detail.materialCost);
  const unitTimesArea = d(detail.unitPrice) * d(detail.area);
  return Math.max(materialCost, unitTimesArea);
}

// Aggregate CostItem from its details
function aggregateCostItem(item: CostItemWithDetails): CostItemInput {
  const totalMaterial = item.details.reduce((sum, det) => sum + resolveDetailCost(det), 0);
  return {
    category: item.category,
    materialCost: totalMaterial,
    laborCost: item.details.reduce((sum, det) => sum + d(det.laborCost), 0),
    otherCost: item.details.reduce((sum, det) => sum + d(det.otherCost), 0),
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tRPC v10 `createNextApiHandler` | tRPC v11 `fetchRequestHandler` | tRPC v11 (2024) | Already using v11 pattern in project |
| Auth.js (NextAuth.js) | Better Auth | Project decision (DEC-017) | Simpler Prisma model conventions, built-in email/password |
| Zod v3 `z.string().email()` | Zod v4 `z.email()` or `z.string().email()` (deprecated) | Zod v4 (2025) | Minor syntax update; old form still works |
| `next/headers` sync | `next/headers` async (`await headers()`) | Next.js 15 | Must await `headers()` before passing to `getSession()` |
| Prisma `@prisma/client` import | Prisma 7 custom output path `../src/generated/prisma` | Prisma 7 | Already configured in project; Better Auth adapter must import from custom path |

**Deprecated/outdated:**
- `z.nativeEnum()`: Deprecated in Zod v4, use `z.enum()` which now accepts enum-like objects
- `message` param in Zod: Deprecated, use `error` param instead
- `getServerSession()` from Auth.js: Not applicable -- using Better Auth `auth.api.getSession()`

## Open Questions

1. **superjson + Prisma Decimal custom registration**
   - What we know: superjson can register custom serializers for Decimal. The project already uses superjson in tRPC.
   - What's unclear: Whether to register a global Decimal serializer or convert to Number in each router. Converting to Number is simpler and avoids precision concerns since all values are EUR amounts (2dp) or rates (4dp).
   - Recommendation: Convert to `Number()` explicitly in routers. No custom superjson registration needed. This is clearer and matches what the engine expects.

2. **Better Auth Prisma adapter with custom output path**
   - What we know: Prisma 7 requires explicit output path. This project uses `output = "../src/generated/prisma"`.
   - What's unclear: Whether Better Auth's `prismaAdapter` works correctly with the custom import path.
   - Recommendation: Import PrismaClient from `@/generated/prisma/client` in the auth config, same as the rest of the codebase. Test early.

3. **CostItem aggregation trigger**
   - What we know: CostItemDetail CRUD is individual. The CostItem `materialCostAgg`, `laborCostAgg`, `otherCostAgg` fields need to reflect detail totals.
   - What's unclear: Whether to recompute aggregates on every detail save (in the mutation), or compute them on-the-fly during calculation.
   - Recommendation: Recompute aggregates in the detail mutation (keep DB consistent). Also recompute from details during calculation (single source of truth for engine).

## Sources

### Primary (HIGH confidence)
- [tRPC Authorization docs](https://trpc.io/docs/server/authorization) - Protected procedures, middleware pattern
- [tRPC Context docs](https://trpc.io/docs/server/context) - Context creation, inner/outer pattern
- [tRPC Error Handling docs](https://trpc.io/docs/server/error-handling) - TRPCError codes and HTTP mapping
- [tRPC Routers docs](https://trpc.io/docs/server/routers) - Router definition, sub-router merging
- [tRPC Validators docs](https://trpc.io/docs/server/validators) - Zod input/output validation
- [tRPC Data Transformers docs](https://trpc.io/docs/server/data-transformers) - superjson configuration
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next) - API route, middleware, session
- [Better Auth basic usage](https://better-auth.com/docs/basic-usage) - signUp, signIn, signOut, useSession
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma) - Prisma 7 setup, provider config
- [Zod v4 release notes](https://zod.dev/v4) - Breaking changes, new API
- [Zod v4 migration guide](https://zod.dev/v4/changelog) - v3 to v4 changes

### Secondary (MEDIUM confidence)
- [tRPC + Better Auth + Prisma integration guide](https://dev.to/ayoubphy/step-by-step-guide-setting-up-trpc-better-auth-prisma-and-react-router-v7-4ho) - Context integration pattern verified against official docs
- [Prisma Decimal handling discussion](https://github.com/prisma/prisma/discussions/16218) - Community consensus on Number conversion
- [superjson Decimal registration](https://github.com/blitz-js/blitz/issues/2491) - Custom serializer pattern

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and partially configured; versions verified in package.json
- Architecture: HIGH - tRPC context + middleware + router patterns are well-documented and verified; Better Auth integration pattern confirmed by multiple sources
- Pitfalls: HIGH - Decimal serialization, cookie forwarding, enum conversion are well-known issues with documented solutions

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable libraries, 30-day window)

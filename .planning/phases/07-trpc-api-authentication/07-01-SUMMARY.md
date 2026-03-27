---
phase: 07-trpc-api-authentication
plan: 01
subsystem: api, auth
tags: [better-auth, trpc, middleware, prisma, email-password]

requires:
  - phase: 01-project-scaffolding
    provides: tRPC init stub with superjson, Prisma client singleton
  - phase: 03-schema-types-constants
    provides: EN 15459 constants, energy sources, Prisma schema with auth models
provides:
  - Better Auth server config with Prisma adapter and email/password
  - Better Auth React client (signUp, signIn, signOut, useSession)
  - Auth API route handler at /api/auth/[...all]
  - tRPC context with db, session, user from Better Auth
  - protectedProcedure that rejects unauthenticated requests
  - requireProjectRole middleware for role-based project access
  - Reference data router (EN 15459, energy sources, cost categories)
affects: [07-02, 07-03, 08-ui-components]

tech-stack:
  added: []
  patterns: [better-auth-prisma-adapter, trpc-auth-context, role-based-middleware, public-reference-router]

key-files:
  created:
    - src/lib/auth.ts
    - src/lib/auth-client.ts
    - src/app/api/auth/[...all]/route.ts
    - src/server/trpc/middleware/auth.ts
    - src/server/trpc/routers/reference.ts
  modified:
    - src/server/trpc/init.ts

key-decisions:
  - "Middleware typed via cast (AuthenticatedCtx) since requireProjectRole always chains after protectedProcedure"
  - "Export t.middleware from init.ts so role middleware uses proper tRPC middleware builder"
  - "Cost categories defined as static const array matching Prisma CostCategory enum values"

patterns-established:
  - "Auth context pattern: auth.api.getSession({ headers }) in createTRPCContext"
  - "Protected procedure pattern: protectedProcedure narrows user from null to User"
  - "Role middleware pattern: requireProjectRole(...roles) checks ProjectMember + implicit creator OWNER"
  - "Public procedure pattern: baseProcedure for non-sensitive reference data"

requirements-completed: [API-01, API-06, AUTH-01, AUTH-02, AUTH-03]

duration: 4min
completed: 2026-03-27
---

# Phase 7 Plan 01: Auth + tRPC Context + Reference Router Summary

**Better Auth with Prisma adapter for email/password auth, tRPC context with session injection, protectedProcedure, role-based requireProjectRole middleware, and reference data router for EN 15459 components, energy sources, and cost categories**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T09:37:27Z
- **Completed:** 2026-03-27T09:42:19Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Better Auth configured with Prisma adapter, email/password enabled, nextCookies plugin for SSR
- tRPC context rewritten to inject auth session, db, and user into all procedures
- protectedProcedure rejects unauthenticated calls with UNAUTHORIZED error code
- requireProjectRole middleware checks ProjectMember table and treats project creator as implicit OWNER
- Reference router serves EN 15459 components (79), energy sources (18), and cost categories (21) as public endpoints

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Better Auth and create auth API route** - `7f5cfee` (feat)
2. **Task 2: Rewrite tRPC context with auth session and create protectedProcedure + role middleware** - `7d6b761` (feat)
3. **Task 3: Create reference data router for EN 15459 components and energy sources** - `294366f` (feat)

## Files Created/Modified
- `src/lib/auth.ts` - Better Auth server config with Prisma adapter, email/password, nextCookies
- `src/lib/auth-client.ts` - Better Auth React client for signUp/signIn/signOut/useSession
- `src/app/api/auth/[...all]/route.ts` - Next.js catch-all route handler for auth endpoints
- `src/server/trpc/init.ts` - Rewritten: context with auth session, protectedProcedure, exported middleware
- `src/server/trpc/middleware/auth.ts` - Role-based project access middleware (requireProjectRole)
- `src/server/trpc/routers/reference.ts` - Public router for EN 15459 components, energy sources, cost categories

## Decisions Made
- Exported `t.middleware` from init.ts so the role middleware file can use proper tRPC middleware builder without importing the internal `t` instance
- Used `AuthenticatedCtx` type cast in requireProjectRole since it always chains after protectedProcedure (user guaranteed non-null)
- Cost categories defined as a static `as const` array matching all 21 Prisma CostCategory enum values with human-readable labels and group names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Auth foundation complete: Better Auth config, API route, React client all in place
- tRPC context and protected procedures ready for domain routers (project, variant, cost-item, calculation)
- requireProjectRole middleware available for all project-scoped endpoints
- Reference router ready to serve dropdown/lookup data for the UI
- Next plans (07-02, 07-03) can build project/variant/calculation routers on this foundation

---
*Phase: 07-trpc-api-authentication*
*Completed: 2026-03-27*

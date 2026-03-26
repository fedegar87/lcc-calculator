---
phase: 01-project-scaffolding
plan: 02
subsystem: infra
tags: [tailwind-v4, prisma-7, trpc-11, vitest, design-system, eurac]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Next.js 15 project structure with all npm dependencies installed"
provides:
  - "Tailwind v4 EURAC design system with Inter font and glass morphism utilities"
  - "Prisma 7 generator config with prisma-client provider and PrismaPg driver adapter"
  - "tRPC 11 boilerplate with fetch adapter, client provider, and server caller"
  - "Vitest config with node environment and path aliases"
  - "tRPC healthcheck endpoint at /api/trpc"
  - "Smoke test confirming Vitest works"
affects: [02-excel-audit, 03-database-schema, 04-engine, 05-testing, 07-auth, 08-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [prisma-7-driver-adapter, trpc-11-fetch-adapter, trpc-11-createTRPCContext, vitest-node-env, prisma-config-ts]

key-files:
  created: ["prisma/schema.prisma", "prisma.config.ts", "src/lib/prisma.ts", "src/server/trpc/init.ts", "src/server/trpc/router.ts", "src/server/trpc/client.tsx", "src/server/trpc/server.tsx", "src/server/trpc/query-client.ts", "src/app/api/trpc/[...trpc]/route.ts", "vitest.config.ts", "tests/smoke.test.ts"]
  modified: ["src/app/page.tsx", "src/app/layout.tsx", "eslint.config.mjs", "tsconfig.json"]

key-decisions:
  - "Prisma 7 url property removed from schema.prisma datasource (no longer supported); prisma.config.ts added for migration URL"
  - "Prisma client imported from generated/prisma/client (no index barrel in Prisma 7 generated output)"
  - "tRPC v11 createHydrationHelpers removed (not available in @trpc/tanstack-react-query v11.15); server.tsx uses createCallerFactory directly"
  - "tRPC client uses createTRPCClient from @trpc/client (TRPCProvider.createClient does not exist in v11)"
  - "ESLint config rewritten with FlatCompat for eslint-config-next v15 + ESLint 9 compatibility"

patterns-established:
  - "Prisma 7: datasource block has no url; connection via PrismaPg adapter in PrismaClient constructor"
  - "Prisma 7: prisma.config.ts at root for CLI configuration (schema path, migrate URL)"
  - "tRPC 11: TRPCProvider accepts trpcClient and queryClient props; createTRPCClient from @trpc/client"
  - "tRPC 11: server caller via createCallerFactory(appRouter) without hydration helpers"
  - "ESLint: FlatCompat wrapper for legacy eslint-config-next with ESLint 9 flat config"

requirements-completed: [SETUP-01, SETUP-03]

# Metrics
duration: 12min
completed: 2026-03-26
---

# Phase 1 Plan 2: Tooling Configuration Summary

**Prisma 7 with driver adapter, tRPC 11 healthcheck endpoint, Vitest smoke test, and EURAC-branded placeholder page on Next.js 15**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-26T13:11:41Z
- **Completed:** 2026-03-26T13:24:10Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Prisma 7 generator configured with prisma-client provider, PrismaPg driver adapter, and prisma.config.ts
- tRPC 11 boilerplate: init, router (with healthcheck), client provider, server caller, query-client, API route handler
- Vitest configured with node environment, vite-tsconfig-paths, smoke test passing
- Default create-next-app page replaced with minimal LCCzero placeholder using EURAC primary color
- Layout wrapped with TRPCReactProvider for client-side tRPC access
- ESLint flat config fixed for eslint-config-next v15 + ESLint 9 compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Tailwind v4 EURAC design system and Inter font** - `4165454` (feat)
2. **Task 2: Set up Prisma 7, tRPC 11 boilerplate, Vitest config** - `9da7c10` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Prisma 7 generator with prisma-client provider, output to src/generated/prisma
- `prisma.config.ts` - Prisma 7 CLI config (schema path)
- `src/lib/prisma.ts` - PrismaClient singleton with PrismaPg driver adapter
- `src/server/trpc/init.ts` - tRPC initialization with superjson transformer
- `src/server/trpc/router.ts` - Root router with healthcheck procedure
- `src/server/trpc/client.tsx` - Client-side tRPC provider with httpBatchLink
- `src/server/trpc/server.tsx` - Server-side caller factory
- `src/server/trpc/query-client.ts` - QueryClient factory with superjson serialization
- `src/app/api/trpc/[...trpc]/route.ts` - tRPC fetch handler for App Router
- `vitest.config.ts` - Vitest with node environment and vite-tsconfig-paths
- `tests/smoke.test.ts` - Smoke test verifying Vitest works
- `src/app/page.tsx` - Minimal LCCzero placeholder with EURAC primary color
- `src/app/layout.tsx` - Added TRPCReactProvider wrapper
- `eslint.config.mjs` - FlatCompat for eslint-config-next + underscore unused vars rule
- `tsconfig.json` - jsx: "preserve" (Next.js default)

## Decisions Made
- **Prisma 7 datasource url removed:** Prisma 7.5 no longer supports `url` in the schema `datasource` block. Moved connection config to `prisma.config.ts` and runtime adapter.
- **Prisma client import path:** Prisma 7 generates to `src/generated/prisma/` but without an index barrel file. Import from `../generated/prisma/client` explicitly.
- **tRPC v11 API changes:** `createHydrationHelpers` from `@trpc/tanstack-react-query/rsc` does not exist in v11.15. Server-side tRPC uses `createCallerFactory` directly. Client uses `createTRPCClient` from `@trpc/client` instead of `TRPCProvider.createClient`.
- **ESLint FlatCompat:** eslint-config-next v15 exports legacy-format config objects, not flat config arrays. Used `@eslint/eslintrc` FlatCompat wrapper.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma 7 datasource url property no longer supported**
- **Found during:** Task 2 (Prisma generate)
- **Issue:** `npx prisma generate` failed with P1012: "The datasource property `url` is no longer supported in schema files"
- **Fix:** Removed `url = env("DATABASE_URL")` from schema.prisma, created prisma.config.ts for CLI config
- **Files modified:** prisma/schema.prisma, prisma.config.ts (new)
- **Verification:** `npx prisma generate` succeeds, client generated at src/generated/prisma/
- **Committed in:** 9da7c10

**2. [Rule 3 - Blocking] Prisma 7 generated client has no index barrel**
- **Found during:** Task 2 (build verification)
- **Issue:** `import { PrismaClient } from "../generated/prisma"` failed - no index.ts exists in generated output
- **Fix:** Changed import to `"../generated/prisma/client"` where PrismaClient is actually exported
- **Files modified:** src/lib/prisma.ts
- **Verification:** `next build` passes type checking
- **Committed in:** 9da7c10

**3. [Rule 3 - Blocking] ESLint config incompatible with ESLint 9 flat config**
- **Found during:** Task 2 (build verification)
- **Issue:** eslint-config-next exports legacy config objects, not iterable flat config arrays. `...nextVitals` throws "nextVitals is not iterable"
- **Fix:** Replaced direct imports with FlatCompat wrapper from @eslint/eslintrc
- **Files modified:** eslint.config.mjs
- **Verification:** `next build` linting passes
- **Committed in:** 9da7c10

**4. [Rule 3 - Blocking] tRPC v11 TRPCProvider.createClient does not exist**
- **Found during:** Task 2 (build verification)
- **Issue:** The plan's tRPC client pattern used `TRPCProvider.createClient()` which is not part of tRPC v11 API
- **Fix:** Used `createTRPCClient` from `@trpc/client`, passed to TRPCProvider via `trpcClient` prop
- **Files modified:** src/server/trpc/client.tsx
- **Verification:** `next build` passes type checking
- **Committed in:** 9da7c10

**5. [Rule 3 - Blocking] createHydrationHelpers not available in tRPC v11**
- **Found during:** Task 2 (build verification)
- **Issue:** `@trpc/tanstack-react-query/rsc` subpath does not exist. `createHydrationHelpers` not exported.
- **Fix:** Simplified server.tsx to export caller and getQueryClient directly via createCallerFactory
- **Files modified:** src/server/trpc/server.tsx
- **Verification:** `next build` passes
- **Committed in:** 9da7c10

---

**Total deviations:** 5 auto-fixed (5 blocking issues from API changes in Prisma 7 / tRPC 11 / ESLint 9)
**Impact on plan:** All auto-fixes necessary to make the boilerplate compile. The plan's code snippets assumed slightly different API surfaces than what Prisma 7.5 and tRPC 11.15 actually provide. No scope creep.

## Issues Encountered
- Vitest warns that `vite-tsconfig-paths` is no longer needed (Vite now supports tsconfig paths natively). Kept the plugin per the plan spec; can be removed in a future cleanup.
- `prisma.config.ts` `earlyAccess` property does not exist in Prisma 7.5 config type (was in research doc). Removed it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full dev environment operational: `npm run dev`, `npm run build`, `npm run test:run` all work
- tRPC healthcheck at /api/trpc ready for testing once dev server runs
- Prisma generator ready; models to be added in Phase 3
- Design system (EURAC colors, Inter font, glass morphism) ready for UI work in Phase 8
- No blockers for Phase 2 (Excel audit)

## Self-Check: PASSED

All 14 files verified present. Both commits (4165454, 9da7c10) verified in git log.

---
*Phase: 01-project-scaffolding*
*Completed: 2026-03-26*

---
phase: 13-database-smoke-test
plan: 01
subsystem: database
tags: [prisma, postgresql, migration, seed, docker]

requires:
  - phase: 12-docker-environment-setup
    provides: Docker PostgreSQL + .env with DATABASE_URL
provides:
  - Initial Prisma migration for all 20+ models
  - Working seed command with demo data
  - Updated run.bat with 5-step flow
affects: [13-02, 14-e2e-verification]

tech-stack:
  added: []
  patterns: [prisma-config-datasource-url, dotenv-config-import]

key-files:
  created:
    - prisma/migrations/20260328125211_init/migration.sql
    - prisma/migrations/migration_lock.toml
  modified:
    - prisma.config.ts
    - package.json
    - run.bat

key-decisions:
  - "Prisma 7 requires datasource.url in prisma.config.ts for migrate commands -- added dotenv/config import + datasource block"
  - "Single initial migration for all 20+ models (clean baseline)"
  - "run.bat uses migrate deploy (not migrate dev) for safety -- deploy only applies existing migrations"

patterns-established:
  - "prisma.config.ts: import dotenv/config first, use env() helper for DATABASE_URL"

requirements-completed: [DB-01, DB-02]

duration: 8min
completed: 2026-03-28
---

# Plan 13-01: Database Migration + Seed Summary

**Initial Prisma migration for 20 models with 6 enums, working seed populating demo user + 3-variant project**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-28T12:48:00Z
- **Completed:** 2026-03-28T12:56:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created initial migration covering all 20 models, 6 enums, all indexes and foreign keys
- Seed script runs successfully: demo@lcczero.dev user + CRAVEzero Reference Building with 3 variants
- run.bat updated from 4-step to 5-step flow (added seed, switched to migrate deploy)

## Task Commits

1. **Task 1 + Task 2: Create migration, configure seed, update run.bat** - `f3b7745` (feat)

## Files Created/Modified
- `prisma/migrations/20260328125211_init/migration.sql` - 451-line SQL creating all tables, enums, indexes, FKs
- `prisma/migrations/migration_lock.toml` - Lock file for PostgreSQL provider
- `prisma.config.ts` - Added dotenv/config import, datasource.url, migrations config
- `package.json` - Added prisma.seed configuration
- `run.bat` - 5 steps: postgres, generate, migrate deploy, seed, dev server

## Decisions Made
- Prisma 7 requires `datasource.url` in prisma.config.ts for migrate CLI commands (not just in schema.prisma)
- Added `import "dotenv/config"` to load .env before `env("DATABASE_URL")` resolves
- Used `migrate deploy` in run.bat instead of `migrate dev` (deploy is non-interactive, safer for startup scripts)
- Added `prisma.seed` to both prisma.config.ts (migrations.seed) and package.json (backward compat)

## Deviations from Plan

### Auto-fixed Issues

**1. prisma.config.ts needed datasource.url for Prisma 7 migrate**
- **Found during:** Task 1 (migration creation)
- **Issue:** Prisma 7 requires datasource.url in prisma.config.ts, not just in schema.prisma
- **Fix:** Added `import "dotenv/config"` and `datasource: { url: env("DATABASE_URL") }` to prisma.config.ts
- **Files modified:** prisma.config.ts
- **Verification:** `npx prisma migrate dev --name init` succeeded
- **Committed in:** f3b7745

---

**Total deviations:** 1 auto-fixed (prisma.config.ts update needed for Prisma 7 compatibility)
**Impact on plan:** Essential fix for Prisma 7 migration workflow. No scope creep.

## Issues Encountered
- Docker Desktop was not running initially -- started it and waited ~25 seconds for daemon readiness
- Prisma `env()` helper doesn't auto-load .env files -- required explicit `import "dotenv/config"`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database tables exist and are populated with demo data
- Ready for Plan 13-02: smoke tests (dev server start + engine tests)

---
*Phase: 13-database-smoke-test*
*Completed: 2026-03-28*

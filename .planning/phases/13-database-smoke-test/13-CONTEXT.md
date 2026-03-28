# Phase 13: Database + Smoke Test - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fresh database is fully populated and the application starts without errors. Create initial Prisma migration, verify seed script works against Docker PostgreSQL, confirm app starts and all engine tests pass. No new features, no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Smoke test scope
- Test output goes to console only — no report files or JUnit artifacts
- Success = all 4 success criteria pass: migrate deploy, seed, npm run dev, npm test

### Claude's Discretion
- Migration strategy: single initial migration vs per-model-group (schema has 20+ models)
- Seed verification depth: console output only vs DB query confirmation
- Whether to update run.bat (from Phase 12) to include migrate + seed steps
- Smoke test approach: manual verification vs automated script
- Whether seed needs any adjustments to work with the Docker database credentials

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/seed.ts`: Complete seed implementation — upserts demo user, creates 3-variant project with all nested data
- `prisma/seed-data/`: Modules for shared constants, base-variant, variant-1, variant-2
- `package.json` scripts: db:generate, db:push, db:migrate, db:seed, db:studio, test, test:run

### Established Patterns
- Prisma 7 with `@prisma/adapter-pg` driver adapter pattern
- Seed uses upsert for user (idempotent) but deleteMany+create for project (clean slate)
- Schema has 20+ models with deep nesting via Prisma nested writes

### Integration Points
- `docker-compose.yml` (Phase 12): Provides PostgreSQL 16 at lccuser:lccpass@localhost:5432/lccdb
- `.env` / `.env.example` (Phase 12): DATABASE_URL already aligned with docker-compose
- `run.bat` (Phase 12): May need migrate + seed integration
- `prisma/schema.prisma`: No migrations directory yet — initial migration must be created

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-database-smoke-test*
*Context gathered: 2026-03-28*

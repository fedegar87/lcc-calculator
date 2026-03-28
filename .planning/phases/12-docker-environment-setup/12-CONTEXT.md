# Phase 12: Docker + Environment Setup - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Developer has a running PostgreSQL instance and correctly configured environment after following .env.example. Single script (`run.bat`) brings up the full local dev stack. No cloud deployment, no CI/CD, no production config.

</domain>

<decisions>
## Implementation Decisions

### Docker services
- PostgreSQL 16 only — no pgAdmin, no Adminer
- Developer uses `prisma studio` (existing `db:studio` script) for DB browsing
- No health check on the container — keep it simple

### Environment variables
- Keep the existing 4 variables: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, EXPORT_DIR
- Minimal inline comments — no section headers or verbose descriptions
- DATABASE_URL in .env.example must match docker-compose defaults exactly (same user/password/db/port)
- Zero-config: `cp .env.example .env` and it works immediately with docker-compose

### Startup workflow
- `run.bat` is the single entry point — replaces the existing untracked file
- Must check prerequisites: Docker and Node in PATH, error if missing
- Full automation: docker compose up, prisma generate, prisma migrate, npm run dev
- Substitute the current run.bat entirely

### Data lifecycle
- Named Docker volume for PostgreSQL data persistence
- Data survives `docker compose down` (only `down -v` destroys it)

### Claude's Discretion
- Container and volume naming convention
- Port choice (5432 vs alternative to avoid conflicts)
- Whether run.bat also launches npm run dev or just prepares the environment
- Migrate + seed strategy (always vs only-if-needed)
- Whether to create a stop.bat
- BETTER_AUTH_SECRET default value approach (hardcoded dev secret vs generation instructions)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` scripts: db:generate, db:push, db:migrate, db:seed, db:studio — all ready to use
- `prisma/schema.prisma`: PostgreSQL datasource, output to src/generated/prisma

### Established Patterns
- `.env` / `.env.example` already exist with the 4 required variables
- Prisma 7 with `@prisma/adapter-pg` for connection

### Integration Points
- DATABASE_URL consumed by Prisma schema (`datasource db`)
- BETTER_AUTH_SECRET / BETTER_AUTH_URL consumed by Better Auth config
- EXPORT_DIR consumed by export feature

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-docker-environment-setup*
*Context gathered: 2026-03-28*

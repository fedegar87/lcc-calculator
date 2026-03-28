# Phase 15: Documentation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Write a README that enables a new developer to go from `git clone` to a running app with working login page, following only the README instructions. Replaces the default Next.js boilerplate README.

</domain>

<decisions>
## Implementation Decisions

### Content scope
- Brief 1-2 sentence project intro at top ("LCCzero is a Life Cycle Cost calculator for buildings...")
- Quickstart-focused: prerequisites, setup steps, demo credentials
- Include npm scripts quick reference table at the end
- Demo credentials shown directly in README (plaintext) — dev tool on GitLab, convenience wins
- No architecture overview, contributing guidelines, or tech stack section

### Audience & tone
- Assume developer basics: knows git, npm, terminal
- Explain Docker and Prisma steps explicitly (not everyone has used them)
- Neutral technical tone — clean, direct instructions, no personality
- Written in English

### Troubleshooting & extras
- Include troubleshooting section with 3-4 common blockers: Docker not running, port 5432 conflict, Prisma migration fails, auth redirect issues
- Environment variables documented inline during setup steps (only 4 vars, no separate section needed)
- Brief "Known Limitations" note about Recharts/RSC export incompatibility

### Claude's Discretion
- Exact section ordering and heading hierarchy
- Troubleshooting item wording and solutions
- Whether to use code blocks vs inline code for commands

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml`: PostgreSQL 16-alpine, user `lccuser`, password `lccpass`, db `lccdb`, port 5432
- `.env`: 4 variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, EXPORT_DIR)
- `prisma/seed.ts`: Demo user credentials for login
- `package.json`: Scripts — dev, build, test, db:generate, db:push, db:migrate, db:seed, db:studio

### Established Patterns
- Dev server runs on port 3001 (BETTER_AUTH_URL configured for 3001)
- Prisma 7 with `prisma.config.ts` for configuration
- Docker Compose for PostgreSQL only (no app containerization)
- Turbopack enabled for dev (`next dev --turbopack`)

### Integration Points
- README replaces existing default Next.js boilerplate at project root
- `.env` file contains all needed defaults — no `.env.example` needed
- Export router disabled due to Recharts/RSC incompatibility (Phase 14 tech debt)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-documentation*
*Context gathered: 2026-03-28*

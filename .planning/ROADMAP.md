# Roadmap: LCCzero

## Milestones

- v1.0 **LCCzero Calculator** -- Phases 1-11 (shipped 2026-03-28)
- **v1.1 Local Dev Operativo** -- Phases 12-15 (in progress)

## Phases

<details>
<summary>v1.0 LCCzero Calculator (Phases 1-11) -- SHIPPED 2026-03-28</summary>

- [x] Phase 1: Project Scaffolding (2/2 plans) -- completed 2026-03-26
- [x] Phase 2: Excel Workbook Audit (2/2 plans) -- completed 2026-03-26
- [x] Phase 3: Schema, Types & Constants (2/2 plans) -- completed 2026-03-26
- [x] Phase 4: Calculation Engine (4/4 plans) -- completed 2026-03-26
- [x] Phase 5: Engine Tests (2/2 plans) -- completed 2026-03-26
- [x] Phase 6: Database Seed (1/1 plan) -- completed 2026-03-26
- [x] Phase 7: tRPC API & Authentication (3/3 plans) -- completed 2026-03-27
- [x] Phase 8: UI Implementation (5/5 plans) -- completed 2026-03-27
- [x] Phase 9: Export (2/2 plans) -- completed 2026-03-28
- [x] Phase 10: Variant Creation UI (1/1 plan) -- completed 2026-03-28
- [x] Phase 11: Test & Code Quality Cleanup (2/2 plans) -- completed 2026-03-28

**Full archive:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v1.1 Local Dev Operativo

**Milestone Goal:** Make the app fully operational in local development -- anyone who clones the repo can configure, run, and verify the complete LCC calculator end-to-end.

- [x] **Phase 12: Docker + Environment Setup** - Docker Compose for PostgreSQL and environment configuration (completed 2026-03-28)
- [ ] **Phase 13: Database + Smoke Test** - Migrations, seed data, dev server startup, engine tests pass
- [ ] **Phase 14: E2E Verification + Tech Debt** - Full user flow verification and v1.0 tech debt closure
- [ ] **Phase 15: Documentation** - README with complete setup-to-run instructions

## Phase Details

### Phase 12: Docker + Environment Setup
**Goal**: Developer has a running PostgreSQL instance and correctly configured environment after following .env.example
**Depends on**: Nothing (first phase of v1.1; v1.0 code complete)
**Requirements**: INFRA-01, INFRA-02, DB-03
**Success Criteria** (what must be TRUE):
  1. `docker compose up -d` starts PostgreSQL 16 and data persists across container restarts
  2. `.env.example` contains all required variables with descriptions and safe defaults that work out of the box with the Docker setup
  3. `npx prisma generate` completes without errors against the running database
**Plans**: TBD

### Phase 13: Database + Smoke Test
**Goal**: Fresh database is fully populated and the application starts without errors
**Depends on**: Phase 12
**Requirements**: DB-01, DB-02, E2E-01, E2E-05
**Success Criteria** (what must be TRUE):
  1. `npx prisma migrate deploy` creates all tables on a fresh database without errors
  2. Seed script creates a demo user and 3-variant project with all cost data populated
  3. `npm run dev` starts the application and loads the login page in a browser
  4. `npm test` runs all 152+ engine tests with 0 failures
**Plans**: TBD

### Phase 14: E2E Verification + Tech Debt
**Goal**: Complete user workflow verified end-to-end and v1.0 tech debt items resolved
**Depends on**: Phase 13
**Requirements**: E2E-02, E2E-03, E2E-04, DEBT-01, DEBT-02
**Success Criteria** (what must be TRUE):
  1. User can register a new account, log in, and log out successfully
  2. User can create a project, enter data across all 4 input steps (Info, WLC, Construction, Energy), and see calculated results on the Results page
  3. User can download PDF and Excel exports from the Results page
  4. Orphaned tRPC procedures (project.delete, addMember, removeMember, costItem.delete, batchUpsert) are documented as future API surface
  5. Export variantLabel input uses z.enum() with compile-time type narrowing instead of z.string()
**Plans**: TBD

### Phase 15: Documentation
**Goal**: New developer can go from git clone to running app by following README instructions alone
**Depends on**: Phase 14
**Requirements**: INFRA-03
**Success Criteria** (what must be TRUE):
  1. README contains prerequisites section listing Node.js, Docker, and npm versions
  2. README contains step-by-step instructions: clone, configure .env, start Docker, migrate, seed, run dev server
  3. A developer following only the README can reach a working login page without asking questions
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffolding | v1.0 | 2/2 | Complete | 2026-03-26 |
| 2. Excel Workbook Audit | v1.0 | 2/2 | Complete | 2026-03-26 |
| 3. Schema, Types & Constants | v1.0 | 2/2 | Complete | 2026-03-26 |
| 4. Calculation Engine | v1.0 | 4/4 | Complete | 2026-03-26 |
| 5. Engine Tests | v1.0 | 2/2 | Complete | 2026-03-26 |
| 6. Database Seed | v1.0 | 1/1 | Complete | 2026-03-26 |
| 7. tRPC API & Authentication | v1.0 | 3/3 | Complete | 2026-03-27 |
| 8. UI Implementation | v1.0 | 5/5 | Complete | 2026-03-27 |
| 9. Export | v1.0 | 2/2 | Complete | 2026-03-28 |
| 10. Variant Creation UI | v1.0 | 1/1 | Complete | 2026-03-28 |
| 11. Test & Code Quality Cleanup | v1.0 | 2/2 | Complete | 2026-03-28 |
| 12. Docker + Environment Setup | 2/2 | Complete    | 2026-03-28 | - |
| 13. Database + Smoke Test | 1/2 | In Progress|  | - |
| 14. E2E Verification + Tech Debt | v1.1 | 0/? | Not started | - |
| 15. Documentation | v1.1 | 0/? | Not started | - |

---
*Last updated: 2026-03-28 after v1.1 roadmap creation*

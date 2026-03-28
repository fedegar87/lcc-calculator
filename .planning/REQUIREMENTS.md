# Requirements: LCCzero

**Defined:** 2026-03-28
**Core Value:** Accurate, standards-compliant LCC calculations that replicate the verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis.

## v1.1 Requirements

Requirements for local dev operativo. App must be runnable end-to-end by anyone who clones the repo.

### Infrastructure

- [ ] **INFRA-01**: Docker Compose provides PostgreSQL 16 with persistent volume for local development
- [ ] **INFRA-02**: .env.example documents all required environment variables with descriptions and safe defaults
- [ ] **INFRA-03**: README contains step-by-step setup instructions (prerequisites, clone, configure, run)

### Database

- [ ] **DB-01**: Prisma migrations create all tables successfully on a fresh database
- [ ] **DB-02**: Seed script populates demo user and 3-variant project without errors
- [ ] **DB-03**: Prisma Client generates without errors after migration

### End-to-End Verification

- [ ] **E2E-01**: `npm run dev` starts the application without errors on a fresh setup
- [ ] **E2E-02**: User can register a new account, log in, and log out
- [ ] **E2E-03**: User can create a project, enter data across all 4 input steps, and view calculated results
- [ ] **E2E-04**: User can export PDF and Excel reports that download successfully
- [ ] **E2E-05**: All 152+ engine tests pass (`npm test`)

### Tech Debt

- [ ] **DEBT-01**: Orphaned tRPC procedures documented as future API surface (project.delete, addMember, removeMember, costItem.delete, batchUpsert)
- [ ] **DEBT-02**: Export variantLabel input uses z.enum() with compile-time type narrowing

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Analysis

- **EXT-01**: Sensitivity analysis (OAT) for discount rate, energy prices, maintenance %
- **EXT-02**: Tornado chart showing parameter sensitivity impact

### Collaboration

- **COLLAB-01**: Project templates with pre-filled sample data
- **COLLAB-02**: CSV import for batch cost data entry

### Internationalization

- **I18N-01**: Multi-language support (EN, DE, IT)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud deployment (Vercel, Docker production) | v1.1 is local dev only; deploy is a separate milestone |
| CI/CD pipeline (GitHub Actions, GitLab CI) | Not needed for local dev operativo |
| Connection pooling (PgBouncer) | Single-user local dev doesn't need pooling |
| Wiring orphaned procedures to UI | Would require new UI components; document-only for v1.1 |
| Linux/Mac run scripts | Windows is the primary dev environment; README covers cross-platform |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | - | Pending |
| INFRA-02 | - | Pending |
| INFRA-03 | - | Pending |
| DB-01 | - | Pending |
| DB-02 | - | Pending |
| DB-03 | - | Pending |
| E2E-01 | - | Pending |
| E2E-02 | - | Pending |
| E2E-03 | - | Pending |
| E2E-04 | - | Pending |
| E2E-05 | - | Pending |
| DEBT-01 | - | Pending |
| DEBT-02 | - | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*

# Milestones

## v1.1 Local Dev Operativo (Shipped: 2026-03-28)

**Phases completed:** 5 phases, 9 plans, 0 tasks

**Key accomplishments:**
- Docker Compose with PostgreSQL 16 for zero-config local development
- Prisma 7 migration + seed populating demo user and 3-variant project
- All 152 engine tests passing, dev server starts cleanly on fresh setup
- Tech debt closed: z.enum() for variantLabel, orphaned tRPC procedures documented
- E2E verification: auth + data entry flows pass; export blocked (Recharts/RSC)
- README quickstart guide: clone-to-login in 8 steps with demo credentials

### Known Gaps
- E2E-04: PDF/Excel export blocked by Recharts/RSC incompatibility (deferred to chart library migration)

---

## v1.0 milestone (Shipped: 2026-03-28)

**Phases completed:** 11 phases, 26 plans, 0 tasks

**Key accomplishments:**
- EN 15459-compliant calculation engine with 35+ formulas, formula mode toggle (excel_replica/bugfixed), and golden dataset validation (152 tests)
- Full-stack web app replacing CRAVEzero Excel workbook: Next.js 15, tRPC 11, Prisma 7, Better Auth
- Glass morphism wizard UI with 5-step data entry, 500ms autosave, EN 15459 service component integration
- Interactive results dashboard with KPI cards, 3 chart types, and 3-variant side-by-side comparison
- PDF and Excel export with immutable ResultSnapshot (engine version + input hash)
- 62/62 requirements satisfied, 51k LOC TypeScript, 118 commits in 3 days

---


# Milestones

## SA Sensitivity Analysis — Pernetti et al. 2021 (Shipped: 2026-05-17, local)

**Phases completed:** 4 phases (SA-0 + SA-1 + SA-2 + SA-Hygiene), 15 plans

**Key accomplishments:**
- Engine: pure-TS `src/engine/sensitivity/` module with seedable mulberry32 RNG, lens-based parameter registry (top-4 paper-dominant + costItems extension), DSA driver with paper-style sensitivity index, Morris radial trajectory sampling at p=4 levels, Campolongo 100×10 sample screening (paper §2.2.3, not exhaustive enumeration), Elementary Effects driver with paper-modified Eq. 4 (absolute LCC units, not normalised), three indices μ/μ*/σ per paper Eqs. 5–7, box-plot LCC distribution capture
- Persistence: Prisma `SensitivityRun` model + `SAMethod` enum + handwritten migration (no shadow DB needed)
- API: tRPC `sensitivity.listParameters`, `runDSA`, `runEE`, `listRuns`, `getRun` with input validation + variation scheme echo
- UI: Sensitivity tab in results page with tornado plot (paper Fig. 1/2), μ*–σ scatter with linear/log toggle (paper Fig. 3/4), LCC distribution box plot (paper Fig. 5), run history with one-click restore
- Paper replication: Väla Gård fixture + regression suite asserts top-3 contains interest rate + structural cost, LCC variation in 15–37% envelope
- Print stylesheet: `@media print` rules + `print:hidden` on chrome so the report renders cleanly
- Comparison view: sortable KPI table + "Best LCC" badge on the winning variant column
- Onboarding: "CRAVEzero sample" badge distinguishes preview projects from user-owned
- Landing copy: dropped "EE next" wording after SA-2 shipped — methodology card now reads "DSA + EE per Pernetti 2021"
- 225 tests passing across 22 files (28 new for SA), tsc + lint clean

### Known Gaps
- Sobol / LHS / Monte Carlo (SA-3) — gated on profiling
- `methodProfile` gate at `sensitivity.ts:148` — activates with method-profile UI
- Migration not applied to Render production yet — user reviewing build locally first

---

## v1.3 Reporting Hygiene (Shipped: 2026-05-15)

**Phases completed:** 1 phase (Phase 17), 3 plans (audit + operative plan + visual identity)

**Key accomplishments:**
- Independent audit + operative plan (`docs/research/2026-05-15-*.md`) addresses methodology gaps flagged after publication review
- Engine: methodProfile metadata threaded into LCCResult (CRAVEZERO_LEGACY / EPBD_2025_DRAFT / LEVELS_50Y_DRAFT / CUSTOM)
- Engine: off-by-one fix on cumulated arrays (shared helper, no logic duplication, Vitest covered)
- Dashboard: assumptions box now dynamic against `methodProfile` instead of hard-coded "40 years / 1.51%"
- Landing copy: drop unsupported claims ("Sobol", "energy ≈ 12% of LCC", "sensitivity baked into the workflow")
- Visual identity continuation: ambient backgrounds, glass-card polish, error toast hardening

### Known Gaps
- EPBD_2025_DRAFT and LEVELS_50Y_DRAFT remain `status: "metadata_only"` until their respective method-profile coding lands
- 8 deferred decisions documented in `operative-plan.md §8` still gate v2.x

---

## v1.2 Gap Analysis Fixes (Shipped: 2026-03-28)

**Phases completed:** 1 phase, 2 plans

**Key accomplishments:**
- Stakeholder Role dropdown (Owner / Tenant / Third Party) added to WLC Boundary Conditions section (GAP-01)
- MaintenanceConfig slider moved from Energy form to Construction form where it logically belongs (GAP-02)
- All 2/2 gap analysis requirements from Excel workbook audit closed

### Known Gaps
- None — all v1.2 requirements complete

---

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


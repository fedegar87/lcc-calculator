# Roadmap: LCCzero

## Overview

LCCzero replaces the CRAVEzero Excel workbook with a web application for Life-Cycle Cost analysis of nearly-Zero Energy Buildings. The build order follows a bottom-up dependency chain: scaffolding, then Excel audit to extract the source of truth, then schema and types informed by the audit, then the pure calculation engine (highest-risk component), then tests to validate it against Excel, then seed data, then API and auth to expose it, then UI to consume it, and finally export to produce deliverables. Every phase builds on the previous one's outputs. The engine is the architectural center of gravity -- everything else exists to feed it inputs and present its outputs.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Scaffolding** - Next.js 15 project with TypeScript, Tailwind, Prisma, tRPC, Vitest, and GitLab remote
- [x] **Phase 2: Excel Workbook Audit** - Programmatic extraction of all formulas, EN 15459 data, and energy sources from CRAVEzero workbook
- [x] **Phase 3: Schema, Types & Constants** - Prisma schema with Decimal types, engine type interfaces, EN 15459 constants, and validation rules
- [x] **Phase 4: Calculation Engine** - Pure TypeScript functions implementing 35+ LCC formulas with formula mode toggle
- [x] **Phase 5: Engine Tests** - Golden dataset validation of all engine modules against Excel reference values
- [x] **Phase 6: Database Seed** - Demo user, project, and 3 variants with realistic data matching Excel tutorial
- [ ] **Phase 7: tRPC API & Authentication** - Type-safe API layer with protected procedures and email/password auth
- [x] **Phase 8: UI Implementation** - Glass morphism wizard UI with data entry forms, results dashboard, and interactive charts (completed 2026-03-27)
- [x] **Phase 9: Export** - PDF and Excel export with immutable ResultSnapshot creation (completed 2026-03-28)
- [ ] **Phase 10: Variant Creation UI** - Wire UI for creating VARIANT_1/VARIANT_2 via existing addVariant procedure
- [ ] **Phase 11: Test & Code Quality Cleanup** - Fix test compilation, add calculateAll, validate at API boundary, remove duplicate helpers

## Phase Details

### Phase 1: Project Scaffolding
**Goal**: Developer can clone the repo and run a working Next.js application with all tooling configured
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, SETUP-03
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` starts the Next.js 15 application without errors
  2. TypeScript strict mode catches type errors at build time
  3. Running `npm test` executes Vitest with zero configuration issues
  4. Git repository has GitLab remote configured and initial commit pushed
**Plans**: 2 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md -- Scaffold Next.js 15, install all dependencies, shadcn/ui, Git config
- [x] 01-02-PLAN.md -- Configure design system, Prisma 7, tRPC 11, Vitest, package scripts

### Phase 2: Excel Workbook Audit
**Goal**: All formulas, data tables, and domain knowledge are extracted from the Excel workbook into machine-readable artifacts
**Depends on**: Phase 1
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05
**Success Criteria** (what must be TRUE):
  1. Formula map documents 35+ formula IDs (FIN, NRG, MNT, CAL, AGG, RES, INC) with cell references and mathematical notation
  2. EN 15459 lookup table contains 80+ HVAC components with lifespan and maintenance percentage, validated programmatically
  3. Energy source list is extracted with all fields from the Project Information sheet
  4. Architecture decisions DEC-001 through DEC-010 are documented with rationale from workbook evidence
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md -- Python extraction scripts: EN 15459 table, energy sources, and all formulas to JSON
- [x] 02-02-PLAN.md -- Formula map (35+ IDs) and architecture decisions (DEC-001 through DEC-010) documentation

### Phase 3: Schema, Types & Constants
**Goal**: Data layer and type system are defined so that the engine, database, and API all share a single source of truth for domain structures
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, DATA-09
**Success Criteria** (what must be TRUE):
  1. Prisma schema compiles and generates a migration with all models (User, Project, Variant, CostItem, EnergyInput, ServiceComponent, ResultSnapshot, etc.)
  2. Engine type interfaces (VariantInput, LCCResult, YearlyEnergyCosts) are importable without any Prisma or framework dependency
  3. EN 15459 constants are available as typed TypeScript arrays with validated lifespan and maintenance ranges
  4. Validation schemas reject out-of-range inputs (negative areas, interest rates > 100%, periods < 1 year)
**Plans**: 2 plans in 1 wave (parallel)

Plans:
- [x] 03-01-PLAN.md -- Prisma schema: all models, enums, relations, Decimal types, Better Auth, cascade deletes
- [x] 03-02-PLAN.md -- Engine types, EN 15459 constants from audit JSON, input validation with tests

### Phase 4: Calculation Engine
**Goal**: Pure calculation engine produces correct LCC/WLC results for any valid input, matching Excel behavior in replica mode and fixing known bugs in bugfixed mode
**Depends on**: Phase 3
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08, CALC-09, CALC-10, CALC-11, CALC-12, CALC-13, CALC-14, CALC-15, CALC-16, CALC-17
**Success Criteria** (what must be TRUE):
  1. Engine calculates discount factors, energy costs, and maintenance costs that match Excel intermediate values within 0.01 EUR tolerance
  2. Engine aggregates all cost components into LCC = design + construction + O&M + site management, and WLC = LCC + non-construction
  3. Formula mode toggle produces different maintenance values for MNT-BUG-001 (excel_replica uses buggy exponent, excel_bugfixed uses correct exponent)
  4. Residual value calculation follows ISO 15686-5 for building services (METHOD_IMPROVEMENT, not in Excel)
  5. Income analysis produces net annual income, simple payback period, and NPV (METHOD_IMPROVEMENT, not in Excel)
**Plans**: 4 plans in 2 waves

Plans:
- [x] 04-01-PLAN.md -- Discount and energy cost modules (FIN-001/002, NRG-001..007)
- [x] 04-02-PLAN.md -- Maintenance cost module with MNT-BUG-001 toggle (MNT-001..004, CAL-005..008)
- [x] 04-03-PLAN.md -- Residual value and income analysis (RES-001, INC-001..003)
- [x] 04-04-PLAN.md -- Aggregation module and calculateLCC orchestrator (AGG-001..014, CAL-001..004)

### Phase 5: Engine Tests
**Goal**: Engine correctness is proven against a golden dataset extracted from the Excel workbook, covering all modules and edge cases
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Golden fixture file contains all intermediate and final values extracted from the Excel workbook
  2. Unit tests pass for every engine module (discount, energy, maintenance, aggregate, residual, income)
  3. Integration test validates that calculateLCC() produces final LCC/WLC values matching the golden fixture
  4. Formula mode test confirms excel_replica produces the known buggy value and excel_bugfixed produces the corrected value
  5. Edge case tests pass for zero area, minimum period, no energy inputs, no services, no income, and all-zero costs
**Plans**: 2 plans in 2 waves

Plans:
- [x] 05-01-PLAN.md -- Golden reference fixture (input + hand-calculated expected outputs) and shared test helpers
- [x] 05-02-PLAN.md -- Unit tests (6 modules), integration test, formula mode test, edge case tests

### Phase 6: Database Seed
**Goal**: A developer or reviewer can log in with demo credentials and see a fully populated project with realistic LCC data
**Depends on**: Phase 5
**Requirements**: SEED-01, SEED-02, SEED-03
**Success Criteria** (what must be TRUE):
  1. Running `npx prisma db seed` creates a demo user with hashed password that can authenticate
  2. Demo project contains 3 variants (BASE, VARIANT_1, VARIANT_2) with data matching the Excel tutorial
  3. All data domains are populated: geometry, boundary conditions, energy inputs, cost items, service components, WLC inputs, income inputs
**Plans**: 1 plan in 1 wave

Plans:
- [x] 06-01-PLAN.md -- Seed script with demo user (Better Auth), project with 3 variants, all data domains populated

### Phase 7: tRPC API & Authentication
**Goal**: Authenticated users can perform all data operations and trigger calculations through a type-safe API
**Depends on**: Phase 6
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can register with name/email/password and log in to receive a session
  2. User can log out from any page and is redirected to login
  3. Unauthenticated requests to protected tRPC procedures return 401
  4. Project CRUD operations work: create, list, get by ID, update, delete, add/remove member with role control
  5. Calculation endpoint accepts a variant ID and returns complete LCC/WLC results with all intermediate values
**Plans**: 3 plans in 3 waves

Plans:
- [x] 07-01-PLAN.md -- Better Auth config, tRPC context with auth session, protectedProcedure, role middleware, reference router
- [x] 07-02-PLAN.md -- Project router (CRUD + members), cost-item router (detail CRUD + aggregates), Next.js middleware
- [x] 07-03-PLAN.md -- Variant router (per-section upserts), calculation router (engine integration), export stub, app router merge

### Phase 8: UI Implementation
**Goal**: Users can create projects, enter all LCC parameters through a guided wizard, and view calculated results with interactive charts
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13, UI-14, UI-15, UI-16, UI-17, UI-18, UI-19, UI-20
**Success Criteria** (what must be TRUE):
  1. User navigates a 5-step wizard (Info, WLC, Construction, Energy, Results) with variant tabs and glass morphism styling
  2. User enters project data in forms with inline validation, and changes autosave with a visible status indicator (Saved/Saving/Failed)
  3. Construction step displays 21 cost categories in accordions with detail expansion and EN 15459 service component dropdown
  4. Results step shows KPI cards (LCC, WLC, LCC/m2, payback), breakdown tables, and 3 interactive chart types (stacked bar, line, grouped bar)
  5. Variant comparison view displays all 3 variants side by side with comparative charts
**Plans**: 5 plans in 3 waves

Plans:
- [ ] 08-01-PLAN.md -- App shell: layouts, dark mode, auth pages, sidebar, project list
- [ ] 08-02-PLAN.md -- Custom components (GlassCard, SliderInput, KPICard), hooks (autosave, save status), form helpers, wizard steps, variant tabs
- [ ] 08-03-PLAN.md -- Project layout, Info form (metadata, geometry, income), WLC form (boundary conditions, energy prices, non-construction, design costs)
- [ ] 08-04-PLAN.md -- Construction form (21 category accordions, detail rows, EN 15459 combobox), Energy form (consumption table, PV, maintenance config)
- [ ] 08-05-PLAN.md -- Results dashboard: KPI cards, breakdown tables, 3 chart types (stacked bar, line, grouped bar), variant comparison

### Phase 9: Export
**Goal**: Users can generate PDF and Excel reports that capture a complete, immutable snapshot of their LCC analysis
**Depends on**: Phase 8
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. PDF report contains project info, result tables, chart representations, KPI summary, and engine metadata (version, formula mode)
  2. Excel workbook contains 5 sheets with computed values (no formulas), structured for offline review
  3. Every export creates an immutable ResultSnapshot record with engine version, formula mode, and input hash for reproducibility
**Plans**: 2 plans in 2 waves

Plans:
- [x] 09-01-PLAN.md -- Snapshot service, chart renderer, PDF document, Excel workbook, export router mutations
- [x] 09-02-PLAN.md -- Export buttons in results page, download utility, loading states, toast feedback

### Phase 10: Variant Creation UI
**Goal**: Users can create VARIANT_1 and VARIANT_2 from the UI, wiring the existing addVariant tRPC procedure
**Depends on**: Phase 8
**Requirements**: UI-05
**Gap Closure**: Closes UI-05 partial gap and orphaned addVariant procedure (tech debt from audit)
**Success Criteria** (what must be TRUE):
  1. User can click "Add Variant" in variant tabs to create VARIANT_1 or VARIANT_2
  2. New variant appears in tabs immediately after creation
  3. addVariant tRPC procedure has an active UI consumer
**Plans**: TBD

### Phase 11: Test & Code Quality Cleanup
**Goal**: Close remaining low-severity audit gaps: fix test compilation, add batch calculation, validate at API boundary, remove code duplication
**Depends on**: Phase 10
**Requirements**: TEST-05, API-05, DATA-09
**Gap Closure**: Closes TEST-05, API-05, DATA-09 partial gaps and tech debt items from audit
**Success Criteria** (what must be TRUE):
  1. edge-cases.test.ts compiles and all edge case tests pass
  2. calculateAll procedure exists OR useQueries pattern documented as intentional spec
  3. validateVariantInput called at tRPC mutation boundary before calculation
  4. No duplicate d() helper between variant.ts and _shared.ts
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding | 2/2 | Complete | 2026-03-26 |
| 2. Excel Workbook Audit | 2/2 | Complete | 2026-03-26 |
| 3. Schema, Types & Constants | 2/2 | Complete | 2026-03-26 |
| 4. Calculation Engine | 4/4 | Complete | 2026-03-26 |
| 5. Engine Tests | 2/2 | Complete | 2026-03-26 |
| 6. Database Seed | 1/1 | Complete | 2026-03-26 |
| 7. tRPC API & Authentication | 0/? | Not started | - |
| 8. UI Implementation | 0/? | Complete    | 2026-03-27 |
| 9. Export | 2/2 | Complete    | 2026-03-28 |
| 10. Variant Creation UI | 0/? | Not started | - |
| 11. Test & Code Quality Cleanup | 0/? | Not started | - |

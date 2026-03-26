# Requirements: LCCzero

**Defined:** 2026-03-26
**Core Value:** Accurate, standards-compliant LCC calculations that replicate the verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Project Setup

- [x] **SETUP-01**: Project scaffolded with Next.js 15, TypeScript strict, Tailwind v4, Prisma 7, tRPC 11
- [x] **SETUP-02**: Git repository initialized with conventional commits and GitLab remote
- [ ] **SETUP-03**: Vitest configured for engine unit testing

### Excel Audit

- [ ] **AUDIT-01**: All Excel formulas extracted programmatically from CRAVEzero workbook (7 sheets)
- [ ] **AUDIT-02**: EN 15459 lookup table extracted (80+ HVAC components with lifespan, maintenance %)
- [ ] **AUDIT-03**: Energy source list extracted from Project Information sheet
- [ ] **AUDIT-04**: Formula map documented with 35+ formula IDs (FIN, NRG, MNT, CAL, AGG, RES, INC)
- [ ] **AUDIT-05**: Architecture decisions documented (DEC-001 through DEC-010)

### Schema & Types

- [ ] **DATA-01**: Prisma schema with Decimal types for all monetary values and rates
- [ ] **DATA-02**: User, Project, Variant, Geometry, BoundaryCondition models defined
- [ ] **DATA-03**: CostItem with 21 categories (A1-E1) and CostItemDetail for layer breakdown
- [ ] **DATA-04**: EnergyInput with 8 EndUse types (heating 1/2, cooling 1/2, DHW 1/2, household, PV)
- [ ] **DATA-05**: ServiceComponent, WLCInput, DesignCost, IncomeInput, MaintenanceConfig models
- [ ] **DATA-06**: ResultSnapshot with engine version, formula mode, input hash for reproducibility
- [ ] **DATA-07**: Engine type interfaces (VariantInput, LCCResult, YearlyEnergyCosts) defined
- [ ] **DATA-08**: EN 15459 constants extracted from audit as TypeScript constants
- [ ] **DATA-09**: Input validation rules with plausible range checks

### Calculation Engine

- [ ] **CALC-01**: Real interest rate calculated via simplified Fisher formula (FIN-001)
- [ ] **CALC-02**: Discount factors array generated for reference period (FIN-002)
- [ ] **CALC-03**: Energy price escalation with compound growth per energy source (NRG-001)
- [ ] **CALC-04**: Energy cost calculation for 5 end-use types with correct system counts (NRG-002..007)
- [ ] **CALC-05**: Building element maintenance with flat annual % discounted by Rint (MNT-001, MNT-002)
- [ ] **CALC-06**: Building service maintenance with EN 15459 lookup and replacement cycles (MNT-003, MNT-004)
- [ ] **CALC-07**: Formula mode toggle supports excel_replica and excel_bugfixed for MNT-BUG-001
- [ ] **CALC-08**: Energy aggregation: consumed, produced, cumulated time series (CAL-001..004)
- [ ] **CALC-09**: Maintenance aggregation: elements + services, cumulated (CAL-005..008)
- [ ] **CALC-10**: Construction cost aggregation by category with materials/labor totals (AGG-001..004)
- [ ] **CALC-11**: Non-construction, design, and site management costs aggregated (AGG-005..007)
- [ ] **CALC-12**: O&M = energy consumed - PV produced + maintenance (AGG-008..011)
- [ ] **CALC-13**: LCC = design + construction + O&M + site management (AGG-012)
- [ ] **CALC-14**: WLC = LCC + non-construction costs (AGG-013)
- [ ] **CALC-15**: KPI ratios (DC/LCC, CC/LCC, LC/LCC, OC/LCC) with null-safe division (AGG-014)
- [ ] **CALC-16**: Residual value per ISO 15686-5 for building services (RES-001, METHOD_IMPROVEMENT)
- [ ] **CALC-17**: Income analysis: net annual income, simple payback, NPV (INC-001..003, METHOD_IMPROVEMENT)

### Engine Tests

- [ ] **TEST-01**: Golden fixture extracted from Excel with all intermediate and final values
- [ ] **TEST-02**: Unit tests per module (discount, energy, maintenance, aggregate, residual, income)
- [ ] **TEST-03**: Integration test validates full calculateLCC() against golden fixture
- [ ] **TEST-04**: Formula mode test: excel_replica produces buggy value, excel_bugfixed produces corrected
- [ ] **TEST-05**: Edge cases: zero area, min period, no energy, no services, no income, all-zero costs

### Database Seed

- [ ] **SEED-01**: Demo user with hashed password
- [ ] **SEED-02**: Demo project with 3 variants and realistic data matching Excel tutorial
- [ ] **SEED-03**: Complete data coverage: geometry, boundary conditions, energy, costs, services, WLC, income

### API Layer

- [ ] **API-01**: tRPC setup with superjson, protected procedures, auth context
- [ ] **API-02**: Project router: list, getById, create, update, delete, addMember, removeMember
- [ ] **API-03**: Variant router: upsert geometry, boundary conditions, energy, WLC, design costs, income, maintenance
- [ ] **API-04**: Cost-item router: listByVariant, upsert, delete, batchUpsert
- [ ] **API-05**: Calculate router: calculate single variant, calculateAll for comparison
- [ ] **API-06**: Reference router: EN 15459 components, energy sources, cost categories
- [ ] **API-07**: Export router: PDF and Excel generation with ResultSnapshot creation

### Authentication

- [ ] **AUTH-01**: User can register with name, email, password
- [ ] **AUTH-02**: User can log in with email/password and stay logged in
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Protected routes redirect unauthenticated users to login
- [ ] **AUTH-05**: Project access controlled by ProjectMember role (owner/editor/viewer)

### UI - Layout & Navigation

- [ ] **UI-01**: Glass morphism design system with EURAC brand colors (#C8102E primary)
- [ ] **UI-02**: Inter font loaded via next/font/google (weights 300-700)
- [ ] **UI-03**: Responsive sidebar with project list and user menu
- [ ] **UI-04**: 5-step wizard navigation (Info, WLC, Construction, Energy, Results)
- [ ] **UI-05**: Variant tabs (Base, Variant 1, Variant 2) with data indicator
- [ ] **UI-06**: Custom components: GlassCard, InfoTooltip, SliderInput, KPICard
- [ ] **UI-07**: Framer Motion animations with prefers-reduced-motion respect

### UI - Data Entry

- [ ] **UI-08**: Project info form: metadata, geometry, energy indicators, income
- [ ] **UI-09**: WLC form: non-construction costs, boundary conditions with SliderInput, energy prices table, design costs
- [ ] **UI-10**: Construction form: accordion per category, detail expansion, service components with EN 15459 dropdown
- [ ] **UI-11**: Energy form: consumption table with system 1/2, PV, maintenance config
- [ ] **UI-12**: Autosave with 500ms debounce and visual indicator (Saved/Saving/Failed)
- [ ] **UI-13**: Inline validation feedback on form fields

### UI - Results & Charts

- [ ] **UI-14**: KPI cards: LCC, WLC, LCC/m2, payback period
- [ ] **UI-15**: Construction cost breakdown table by category
- [ ] **UI-16**: WLC/LCC breakdown table with O&M detail
- [ ] **UI-17**: Variant comparison side-by-side view
- [ ] **UI-18**: LCC breakdown stacked bar chart
- [ ] **UI-19**: Cost evolution line chart over reference period
- [ ] **UI-20**: Variant comparison grouped bar chart

### Export

- [ ] **EXPORT-01**: PDF report with project info, tables, charts, KPIs, engine metadata
- [ ] **EXPORT-02**: Excel workbook with 5 sheets (values only, no formulas)
- [ ] **EXPORT-03**: Every export creates immutable ResultSnapshot with engine version and input hash

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Analysis

- **EXT-01**: Sensitivity analysis (OAT) for discount rate, energy prices, maintenance %
- **EXT-02**: Tornado chart showing parameter sensitivity impact
- **EXT-03**: End-of-life / recycling costs (ISO 15686-5 process 6)

### Collaboration

- **COLLAB-01**: Project templates with pre-filled sample data
- **COLLAB-02**: CSV import for batch cost data entry
- **COLLAB-03**: Real-time save conflict detection

### Internationalization

- **I18N-01**: Multi-language support (EN, DE, IT)

## Out of Scope

| Feature | Reason |
|---------|--------|
| BIM/IFC import | Massive complexity; users input ~50 parameters manually from PHPP |
| Real-time collaboration (WebSocket) | LCC is sequential analysis, not collaborative editing |
| Monte Carlo simulation | Users rarely have probability distributions; OAT sensitivity sufficient |
| Energy simulation integration (PHPP/EnergyPlus) | Users already have energy values from their tools |
| Mobile native app | Responsive web sufficient; LCC requires detailed data entry |
| OAuth / social login | Academic context; email/password sufficient |
| Cost database with regional pricing | Maintaining accuracy is a separate product |
| End-of-life costs (v1) | CRAVEzero never implemented; data unreliable for 40+ year projections |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Pending |
| AUDIT-01 | Phase 2 | Pending |
| AUDIT-02 | Phase 2 | Pending |
| AUDIT-03 | Phase 2 | Pending |
| AUDIT-04 | Phase 2 | Pending |
| AUDIT-05 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
| DATA-06 | Phase 3 | Pending |
| DATA-07 | Phase 3 | Pending |
| DATA-08 | Phase 3 | Pending |
| DATA-09 | Phase 3 | Pending |
| CALC-01 | Phase 4 | Pending |
| CALC-02 | Phase 4 | Pending |
| CALC-03 | Phase 4 | Pending |
| CALC-04 | Phase 4 | Pending |
| CALC-05 | Phase 4 | Pending |
| CALC-06 | Phase 4 | Pending |
| CALC-07 | Phase 4 | Pending |
| CALC-08 | Phase 4 | Pending |
| CALC-09 | Phase 4 | Pending |
| CALC-10 | Phase 4 | Pending |
| CALC-11 | Phase 4 | Pending |
| CALC-12 | Phase 4 | Pending |
| CALC-13 | Phase 4 | Pending |
| CALC-14 | Phase 4 | Pending |
| CALC-15 | Phase 4 | Pending |
| CALC-16 | Phase 4 | Pending |
| CALC-17 | Phase 4 | Pending |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-03 | Phase 5 | Pending |
| TEST-04 | Phase 5 | Pending |
| TEST-05 | Phase 5 | Pending |
| SEED-01 | Phase 6 | Pending |
| SEED-02 | Phase 6 | Pending |
| SEED-03 | Phase 6 | Pending |
| API-01 | Phase 7 | Pending |
| API-02 | Phase 7 | Pending |
| API-03 | Phase 7 | Pending |
| API-04 | Phase 7 | Pending |
| API-05 | Phase 7 | Pending |
| API-06 | Phase 7 | Pending |
| API-07 | Phase 7 | Pending |
| AUTH-01 | Phase 7 | Pending |
| AUTH-02 | Phase 7 | Pending |
| AUTH-03 | Phase 7 | Pending |
| AUTH-04 | Phase 7 | Pending |
| AUTH-05 | Phase 7 | Pending |
| UI-01 | Phase 8 | Pending |
| UI-02 | Phase 8 | Pending |
| UI-03 | Phase 8 | Pending |
| UI-04 | Phase 8 | Pending |
| UI-05 | Phase 8 | Pending |
| UI-06 | Phase 8 | Pending |
| UI-07 | Phase 8 | Pending |
| UI-08 | Phase 8 | Pending |
| UI-09 | Phase 8 | Pending |
| UI-10 | Phase 8 | Pending |
| UI-11 | Phase 8 | Pending |
| UI-12 | Phase 8 | Pending |
| UI-13 | Phase 8 | Pending |
| UI-14 | Phase 8 | Pending |
| UI-15 | Phase 8 | Pending |
| UI-16 | Phase 8 | Pending |
| UI-17 | Phase 8 | Pending |
| UI-18 | Phase 8 | Pending |
| UI-19 | Phase 8 | Pending |
| UI-20 | Phase 8 | Pending |
| EXPORT-01 | Phase 9 | Pending |
| EXPORT-02 | Phase 9 | Pending |
| EXPORT-03 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*

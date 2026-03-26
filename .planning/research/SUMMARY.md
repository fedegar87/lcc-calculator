# Project Research Summary

**Project:** nZEB Life-Cycle Cost Calculator Web Application
**Domain:** Financial/engineering calculator -- Excel-to-web migration of ISO 15686-5 LCC analysis tool for nearly-Zero Energy Buildings
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This project replaces a CRAVEzero Excel workbook with a web application for Life-Cycle Cost (LCC) analysis of nearly-Zero Energy Buildings, following ISO 15686-5 and EN 15459 standards. Experts in this domain build such tools around a pure calculation engine (35+ documented formulas covering discounting, energy, maintenance, residual value, and aggregation) with a strict separation between financial math and persistence/UI layers. The recommended approach is a Next.js 15 full-stack application with a "functional core, imperative shell" architecture: all LCC formulas live as pure, deterministic TypeScript functions with zero dependencies, tested against a golden dataset extracted from the original Excel workbook. The stack (tRPC, Prisma 7, PostgreSQL, shadcn/ui, Recharts) is mature and well-validated for this use case.

The single greatest risk is formula inaccuracy. Unlike typical web applications where bugs are visually obvious or produce crashes, financial formula errors produce numbers that "look plausible" but are silently wrong. The project has domain-specific hazards: off-by-one discount exponents, mixed nominal/real interest rates across cost categories (an intentional asymmetry in the original Excel), maintenance replacement cycle boundary errors, and floating-point accumulation over 40-year summations. All of these must be caught by test-driven development against the Excel golden dataset before any UI or persistence work begins. The formula mode toggle (excel_replica vs excel_bugfixed) is a unique differentiator for academic credibility and must be designed into the engine from day one, not retrofitted.

The feature scope is well-defined: v1 replaces the Excel with a web equivalent (21 construction cost categories, 5 energy end-use types, EN 15459 maintenance, 3-variant comparison, NPV discounting, charts, PDF/Excel export), while v1.x extends beyond Excel capabilities (residual value, income/payback analysis, sensitivity analysis, result snapshots). The architecture dictates a clear build order: engine first (zero dependencies, fully testable), then database schema (informed by engine types), then API layer, then auth, then UI in order of increasing complexity. This bottom-up approach ensures the highest-risk component (formula accuracy) is validated before any dependent work begins.

## Key Findings

### Recommended Stack

The user's initial stack choices are validated with three corrections: Next.js 15 (not 14), Better Auth (not Auth.js, which merged into Better Auth in September 2025), and the `motion` package (not `framer-motion`, which was renamed). The stack is production-ready and all libraries have proven compatibility with each other.

**Core technologies:**
- **Next.js 15 + React 19 + TypeScript 5.7:** Stable, mature framework combination. v16 exists but ecosystem support is still maturing; upgrade after initial release.
- **Prisma 7 + PostgreSQL 16:** Built-in Decimal type maps to decimal.js, critical for financial storage precision. Schema-driven migrations. v7 rewrote the engine (85% smaller).
- **tRPC 11 + TanStack React Query 5 + Zod 3:** End-to-end type safety. Zod schemas shared between client forms and server validation. superjson required for Decimal serialization.
- **Better Auth:** Auth.js successor. Email/password credentials, session management, Prisma adapter. MEDIUM confidence due to recent merger; Auth.js v5 is a viable fallback.
- **shadcn/ui + Tailwind CSS 4 + Motion 12:** CSS-first Tailwind config, copy-owned components, hardware-accelerated animations for glass morphism design.
- **Recharts 3:** Declarative SVG charts for LCC breakdown, cost evolution, variant comparison. Simpler than alternatives, sufficient for 4-5 chart types.
- **exceljs 4 + @react-pdf/renderer 4:** Server-side Excel and PDF generation. exceljs is stable but unmaintained (MEDIUM confidence); xlsx-js-style is the fallback.
- **Vitest 4 + Testing Library + Playwright:** Fast, ESM-native testing. Critical for golden dataset validation of 35+ formulas.

### Expected Features

**Must have (table stakes -- v1 launch):**
- ISO 15686-5 LCC cost structure with all cost categories
- NPV discounting with dual rate support (Rint for maintenance, RR for energy)
- Construction cost breakdown (21 categories A1-E1)
- Energy cost calculation (5 end-use types, correct system counts)
- Maintenance cost calculation (flat % + EN 15459 replacement cycles)
- WLC = LCC + non-construction costs
- Formula mode toggle (excel_replica vs excel_bugfixed)
- 3-variant comparison (BASE + 2 variants)
- Results visualization (3 chart types: breakdown, evolution, comparison)
- KPI indicators (cost per m2)
- User authentication + project CRUD + autosave
- Export (PDF + Excel)
- 5-step wizard UI

**Should have (differentiators -- v1.x):**
- Residual value calculation (fills gap: Excel has header but no formulas)
- Income / payback / NPV profitability analysis (fills gap: Excel collects data but never calculates)
- Result snapshots with immutable audit trail (academic reproducibility)
- Sensitivity analysis (OAT -- no competitor offers this)
- EN 15459 embedded lookup table (eliminates manual standard lookup)
- Multi-user project sharing (owner/editor/viewer)

**Defer (v2+):**
- Monte Carlo simulation, end-of-life costs, BIM/IFC import, CSV import, multi-language i18n, cost database, mobile app

### Architecture Approach

The architecture follows a "functional core, imperative shell" pattern with four distinct layers: Presentation (wizard + results + export UI), API (tRPC routers with Zod validation), Service/Orchestration (loads from DB, calls engine, stores results), and the Pure Calculation Engine (zero dependencies, deterministic, testable). The engine is the architectural center of gravity -- everything else exists to feed it inputs and present its outputs.

**Major components:**
1. **Calculation Engine (src/engine/)** -- Pure TypeScript functions implementing 35+ formulas (FIN-*, NRG-*, MNT-*, RES-*, INC-*, AGG-*). No imports from Prisma, tRPC, or Next.js. Accepts plain objects, returns plain objects.
2. **Calculation Orchestrator (src/server/services/)** -- The imperative shell: reads inputs from DB (Decimal), converts to JS number, calls engine, converts results back to Decimal, writes ResultSnapshot.
3. **tRPC API Layer (src/server/routers/)** -- Thin routers: validate input (Zod), call services, return results. No business logic.
4. **Wizard UI (src/app/project/[id]/)** -- 5 route segments (info, wlc, construction, energy, results). Each step has its own form state and Zod schema. Autosave via debounced tRPC mutations.
5. **Data Layer (Prisma + PostgreSQL)** -- Decimal types for all financial storage. Schema separates shared parameters (Project level) from per-variant parameters (Variant level).

### Critical Pitfalls

1. **Off-by-one discount exponent** -- Year 0 = construction (no discounting), Year 1+ = operational. Create a single `discountFactor(rate, year)` utility; test against Excel values at Year 0, 1, 20, 40.
2. **Mixed nominal/real rates** -- Maintenance uses Rint (nominal), energy uses RR (real). This is intentional (DEC-005). Each formula function must take the rate as an explicit parameter; integration tests must verify rate isolation.
3. **Maintenance replacement cycle boundaries** -- `year > 0 && year % lifespan === 0 && (year / lifespan) <= maxReplacements`. Test edge cases: Year 0, lifespan > T, lifespan = T. Must support both buggy (MNT-BUG-001) and fixed modes.
4. **Floating-point accumulation** -- 40-year summations drift by ~0.01 EUR. Define tolerance contract (< 0.01 EUR per cost item), use tolerance-based test assertions. Do NOT introduce Decimal.js in the engine.
5. **Variant shared vs. independent parameters** -- Database schema must separate Project-level shared params from Variant-level per-variant params. Failure to do this early requires expensive schema migration later.
6. **Untested formulas (audit gap)** -- Build a golden dataset from the Excel workbook BEFORE implementing formulas. Every formula ID must have at least 3 test cases. This is the project's value proposition.
7. **EN 15459 data integrity** -- Extract lookup table programmatically, not manually. Validate: lifespan in [5, 50], maintenance % in [0.001, 0.10]. Checksum test on totals.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Foundation and Engine Core
**Rationale:** The engine has zero dependencies and is the highest-risk component. Build and fully test it before anything else touches it. Architecture research explicitly recommends "engine first." All 7 critical pitfalls are addressed here.
**Delivers:** Pure calculation engine with golden dataset tests passing for all 35+ formulas in both formula modes. EN 15459 lookup data validated.
**Addresses:** NPV discounting, energy cost calculation, maintenance cost calculation, formula mode toggle, aggregation (LCC/WLC).
**Avoids:** Off-by-one discount exponent, mixed rates, replacement cycle boundaries, floating-point accumulation, formula audit gap, EN 15459 data errors.

### Phase 2: Database Schema and Data Layer
**Rationale:** Engine types inform the Prisma schema. Schema must separate shared (Project) from per-variant (Variant) parameters before any CRUD code. The variant shared/independent param pitfall must be resolved at the schema level.
**Delivers:** Prisma schema with Decimal types, migration files, seed data (EN 15459 lookup table), Decimal-to-number boundary conversion utilities.
**Avoids:** Variant parameter confusion (shared vs. independent), floating-point accumulation in storage.

### Phase 3: API Layer (tRPC + Services)
**Rationale:** The orchestration layer connects engine to database. tRPC routers and services must exist before any UI can consume them. This is where Zod validation enforces boundary safety (numeric ranges, rate formats).
**Delivers:** Type-safe API for project CRUD, variant management, calculation trigger, and result retrieval.
**Uses:** tRPC 11, Zod 3, superjson 2, TanStack React Query 5.
**Avoids:** Interest rate unit confusion (DEC-009 validation at boundary).

### Phase 4: Authentication
**Rationale:** Auth gates access to all project data. Must exist before wizard UI is built so that every page and API call is protected from the start.
**Delivers:** Email/password authentication, session management, protected routes, tRPC context with user session.
**Uses:** Better Auth (fallback: Auth.js v5), Prisma adapter.

### Phase 5: Wizard UI (Data Entry)
**Rationale:** The 5-step wizard is the primary user interaction. Depends on tRPC API and auth being in place. Each step is a route segment for URL persistence.
**Delivers:** 5-step data entry wizard (Info, WLC, Construction, Energy, Results stub), form validation (Zod), autosave (debounced tRPC mutations), progressive disclosure for 21 cost categories.
**Addresses:** Project CRUD, autosave, construction cost breakdown input, energy parameter input, 5-step wizard UI.
**Avoids:** Fat wizard steps (route-per-step), interest rate display confusion (% input, decimal storage).

### Phase 6: Results Dashboard and Visualization
**Rationale:** Depends on calculation API returning data. Users cannot validate the engine without visual output. Charts are needed before export.
**Delivers:** Results step with KPI indicators, 3 chart types (breakdown bar/pie, cost evolution line, variant comparison grouped bar), intermediate calculation display.
**Uses:** Recharts 3.
**Addresses:** Results visualization, KPI indicators, variant comparison display.

### Phase 7: Export (PDF and Excel)
**Rationale:** Depends on ResultSnapshot existing and visualization being complete. PDF export embeds charts; Excel includes computed results. Both require immutable snapshots.
**Delivers:** PDF export with branded template and charts, Excel export with structured worksheets, immutable ResultSnapshot creation.
**Uses:** @react-pdf/renderer 4, exceljs 4.
**Addresses:** Export (PDF + Excel), result snapshots (basic).

### Phase 8: Extended Features (v1.x)
**Rationale:** These features extend beyond Excel capabilities. They should only be built once the core engine is verified against Excel outputs and users confirm interest.
**Delivers:** Residual value calculation, income/payback/NPV analysis, sensitivity analysis (OAT with tornado chart), EN 15459 embedded searchable lookup, multi-user project sharing.
**Addresses:** All P2 features from FEATURES.md.

### Phase 9: Polish and Optimization
**Rationale:** Glass morphism design, accessibility audit (WCAG AA), performance optimization, and potential Next.js 16 upgrade. Non-functional quality that can be layered on last.
**Delivers:** EURAC-branded glass morphism design system, accessibility compliance, performance tuning, export worker threads if needed.

### Phase Ordering Rationale

- **Bottom-up by dependency:** Engine (zero deps) -> Schema (informed by engine types) -> API (bridges engine + DB) -> Auth (gates access) -> UI (consumes API) -> Results (consumes calculation output) -> Export (consumes snapshots).
- **Risk-first:** The engine is the highest-risk component (formula accuracy is the value proposition). Building and testing it first means the most critical code is validated before dependent work begins.
- **Feature dependency graph:** Construction cost breakdown must precede maintenance (category-to-maintenance mapping). NPV discounting must precede energy and maintenance (both use present value). All cost modules must precede sensitivity analysis (it varies parameters across the complete engine).
- **Pitfall prevention:** 6 of 7 critical pitfalls are engine-level. Addressing them in Phase 1 prevents cascading errors into later phases. The variant parameter pitfall is resolved in Phase 2 (schema design) before any CRUD code.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Engine):** Needs `/gsd:research-phase`. The 35+ formulas, golden dataset extraction from Excel, dual formula mode implementation, and EN 15459 data validation are domain-specific and complex. The prior audit documents provide formula specs, but implementation details (edge cases, tolerance thresholds, test fixtures) need phase-level research.
- **Phase 4 (Auth):** Needs `/gsd:research-phase`. Better Auth is relatively new (post-September 2025 merger). Setup with Prisma adapter, Next.js middleware integration, and tRPC context need validated patterns. Auth.js v5 fallback path should be documented.
- **Phase 7 (Export):** Needs `/gsd:research-phase`. PDF generation with embedded charts (Recharts is client-only, @react-pdf/renderer is server-only) requires a bridging strategy. exceljs API for styled financial reports needs investigation.
- **Phase 8 (Extended Features - Sensitivity Analysis):** Needs `/gsd:research-phase`. OAT sensitivity analysis and tornado chart visualization have sparse documentation in the Recharts ecosystem.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Database Schema):** Well-documented Prisma schema patterns. Decimal type usage is documented in Prisma docs.
- **Phase 3 (API Layer):** tRPC + Next.js App Router setup is thoroughly documented with official examples.
- **Phase 5 (Wizard UI):** React Hook Form + Zod + route-per-step is a well-established pattern. shadcn/ui provides form components.
- **Phase 6 (Results Dashboard):** Recharts has extensive documentation and examples for all needed chart types.
- **Phase 9 (Polish):** Tailwind CSS glass morphism patterns are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified with official sources (March 2026). Version compatibility matrix confirmed. Three corrections applied (Next.js 15, Better Auth, motion package). Only MEDIUM items: Better Auth (recent merger), exceljs (unmaintained but stable). |
| Features | HIGH | Grounded in ISO 15686-5, EN 15459, competitor analysis (BLCC, One Click LCA, CRAVEzero, eTool). Feature dependency graph is well-defined. MVP scope is clear. |
| Architecture | HIGH | Functional core/imperative shell is the standard pattern for financial calculators. Build order follows natural dependency graph. Project structure is pragmatic and well-reasoned. |
| Pitfalls | HIGH | Domain-specific pitfalls verified against project context (DEC-001 through DEC-009), Excel workbook methodology, and financial calculation literature. Recovery strategies documented for each pitfall. |

**Overall confidence:** HIGH

### Gaps to Address

- **Better Auth production readiness:** The Auth.js merger happened in September 2025. While documentation exists, edge-case behavior (rate limiting configuration, password policy customization, session refresh under load) may need experimentation. Mitigation: plan Auth.js v5 fallback if friction is encountered early in Phase 4.
- **exceljs long-term viability:** Last published 2 years ago. No security advisories currently, but monitor. Mitigation: xlsx-js-style is a drop-in alternative if needed.
- **PDF chart embedding strategy:** Recharts renders SVG in the browser; @react-pdf/renderer runs on the server. Bridging strategy (table-based fallback, SVG-to-PDF conversion, or headless browser rendering) needs validation in Phase 7 research.
- **Golden dataset completeness:** The prior Excel audit documents 35+ formulas, but the golden dataset (exact input/output values for each formula) must still be extracted from the workbook. This is a prerequisite for Phase 1 and its completeness determines test coverage quality.
- **Performance of 40-year calculation with 3 variants:** Expected to be fast (pure math in JS), but no benchmark exists. Phase 1 should include a performance test target (< 50ms per variant).

## Sources

### Primary (HIGH confidence)
- [Next.js 16.2 Blog Post](https://nextjs.org/blog/next-16-2) -- current version landscape, v15 stability validation
- [Prisma ORM v7.4 Release](https://www.prisma.io/blog/prisma-orm-v7-4-query-caching-partial-indexes-and-major-performance-improvements) -- Decimal type, engine rewrite
- [tRPC v11 Announcement](https://trpc.io/blog/announcing-trpc-v11) -- Next.js App Router integration
- [ISO 15686-5:2017](https://www.iso.org/standard/61148.html) -- LCC cost structure standard
- [NIST Building Life Cycle Cost Programs](https://www.nist.gov/services-resources/software/building-life-cycle-cost-programs) -- reference LCC software
- [CRAVEzero LCC Tool](https://www.cravezero.eu/pboard/Downloads/LCCTool.htm) -- original Excel workbook
- [WBDG Life-Cycle Cost Analysis](https://www.wbdg.org/resources/life-cycle-cost-analysis-lcca) -- LCC methodology reference
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4) -- testing framework
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS framework
- [Recharts npm](https://www.npmjs.com/package/recharts) -- charting library
- [React 19.2.4](https://react.dev/versions) -- UI library

### Secondary (MEDIUM confidence)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next) -- Auth setup (recent project, maturing docs)
- [Auth.js -> Better Auth Merger](https://github.com/nextauthjs/next-auth/discussions/13252) -- merger announcement
- [exceljs npm](https://www.npmjs.com/package/exceljs) -- Excel generation (stable but unmaintained)
- [CRAVEzero D2.3: Structured Repository of Existing LCC Tools](https://www.cravezero.eu/wp-content/uploads/2018/09/CRAVEzero_D23_Structured-Repository-of-existing-LCC-calculation-tools.pdf) -- competitor landscape
- [Sensitivity analysis for nZEB LCC](https://www.sciencedirect.com/science/article/abs/pii/S2210670721004212) -- key parameter sensitivity
- [eTool/Cerclos Features](http://cerclos.com/products/etool/features/) -- competitor features
- [EN 15459-1:2017](https://standards.globalspec.com/std/10219361/en-15459-1) -- HVAC maintenance standard

### Tertiary (LOW confidence)
- None identified. All research findings are backed by at least two independent sources.

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*

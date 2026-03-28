# LCCzero

## What This Is

A web application for Life-Cycle Cost (LCC) analysis of nearly-Zero Energy Buildings (nZEB), replacing the CRAVEzero Excel spreadsheet tool. Calculates total building ownership cost over a reference period (typically 40 years) covering non-construction costs, design, construction, energy, maintenance, residual value, and income-based profitability analysis. Supports a base case + 2 design variants compared side by side. Features a glass morphism wizard UI, interactive charts, and PDF/Excel export with immutable result snapshots.

## Core Value

Accurate, standards-compliant LCC calculations (ISO 15686-5:2017, EN 15459:2018) that replicate the verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis.

## Requirements

### Validated

- ✓ Replicate all Excel workbook formulas (discount, energy, maintenance, aggregation) — v1.0
- ✓ Support formula mode toggle (excel_replica vs excel_bugfixed) with MNT-BUG-001 fix — v1.0
- ✓ Calculate energy costs for 5 end-use types with correct system counts — v1.0
- ✓ Calculate maintenance with building element flat % and building service EN 15459 replacement cycles — v1.0
- ✓ Implement residual value per ISO 15686-5 (METHOD_IMPROVEMENT) — v1.0
- ✓ Implement income/payback/NPV analysis (METHOD_IMPROVEMENT) — v1.0
- ✓ Support 3 variant comparison (BASE, VARIANT_1, VARIANT_2) — v1.0
- ✓ Provide construction cost breakdown by 21 categories (A1-E1) — v1.0
- ✓ Calculate WLC = LCC + non-construction costs with 4-component LCC formula — v1.0
- ✓ Display KPI ratios and per-m2 indicators — v1.0
- ✓ User authentication with email/password — v1.0
- ✓ Project CRUD with multi-user sharing (owner/editor/viewer) — v1.0
- ✓ 5-step wizard UI (Info, WLC, Construction, Energy, Results) — v1.0
- ✓ Autosave with debounce — v1.0
- ✓ Interactive charts (LCC breakdown, cost evolution, variant comparison) — v1.0
- ✓ PDF and Excel export with result snapshots — v1.0
- ✓ Glass morphism UI with EURAC brand colors and accessibility compliance — v1.0

### Active

(None — next milestone requirements TBD via `/gsd:new-milestone`)

### Out of Scope

- End-of-life / recycling costs (ISO 15686-5 process 6) — not implemented in Excel, defer to v2
- Real-time collaboration (WebSocket) — single-user editing sufficient for v1
- Mobile native app — responsive web is sufficient
- OAuth / social login — email/password sufficient for academic/research context
- Multi-language i18n — English only for v1
- Building energy simulation integration (PHPP) — manual input of energy values
- Sensitivity analysis (OAT) — deferred to v2
- CSV import for batch cost data entry — deferred to v2

## Context

Shipped v1.0 with 51,093 LOC TypeScript across 230 files.

- **Source of truth:** CRAVEzero Excel workbook (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`) with 7 sheets, ~3000 formula cells
- **Standards:** ISO 15686-5:2017 (LCC structure), EN 15459:2018 (HVAC maintenance data — 79 components)
- **Engine:** 35+ formula modules with golden dataset validation (152 tests, 0 failures)
- **Critical asymmetry:** Maintenance uses Rint (nominal interest rate), Energy uses RR (real interest rate) — verified in Excel, intentional
- **Known Excel bug:** Maintenance row 62 has `^(I)` instead of `^(I5)` — engine supports both modes via FormulaMode
- **Excel gaps:** Residual value and Income implemented as METHOD_IMPROVEMENT (not in original Excel)
- **Academic context:** EURAC Research / University of Bozen-Bolzano, H2020 CRAVEzero project
- **Tech debt:** 5 orphaned tRPC procedures (no UI consumer), missing GSD tracking files for phases 4/5/11

## Constraints

- **Tech stack:** Next.js 15, TypeScript strict, PostgreSQL, Prisma 7, tRPC 11, Better Auth, Recharts v3, shadcn/ui (base-nova), motion, Tailwind v4
- **Design:** Glass morphism with EURAC brand palette (#C8102E / oklch(0.48 0.18 27.5)), Inter font, WCAG AA accessibility
- **Numeric precision:** Prisma Decimal for DB storage, JS number in engine with controlled rounding at output boundaries
- **GitLab:** Remote at `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`
- **Formula traceability:** Every engine function references formula IDs (FIN-001, NRG-001, etc.)
- **Snapshot reproducibility:** Every export creates an immutable ResultSnapshot with engine version, formula mode, and input hash

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DEC-001: JS number in engine, Decimal in DB | Building LCC precision met by IEEE 754; Decimal prevents accumulation across writes | ✓ Good |
| DEC-002: Formula mode parameter | Enables traceable deviation from Excel behavior | ✓ Good |
| DEC-003: Replacement cycle cap (default 3) | Matches Excel IF(OR()) pattern; configurable for generic use | ✓ Good |
| DEC-004: Year 0 = construction | Verified against Excel Calc!D7; operational costs start year 1 | ✓ Good |
| DEC-005: Maintenance uses Rint, Energy uses RR | Verified asymmetry in Excel workbook; intentionally replicated | ✓ Good |
| DEC-006: Residual value (METHOD_IMPROVEMENT) | ISO 15686-5 provision; Excel has header but no formulas | ✓ Good |
| DEC-007: Income/NPV (METHOD_IMPROVEMENT) | Excel collects data but never calculates; adds analytical value | ✓ Good |
| DEC-008: Category-to-maintenance mapping | A*=elements(flat%), B*/C*=services(EN15459), D*/E*=none | ✓ Good |
| DEC-009: Interest rate UX as percentage | Store decimal (0.0151), display percentage (1.51%) in UI | ✓ Good |
| DEC-010: Site management separate from design | Results!B62: LCC = design + construction + O&M + site_mgmt | ✓ Good |
| DEC-011: Next.js 15 over 16 | v16 too new at time of build, tooling unverified | ✓ Good |
| DEC-012: Sonner over deprecated Toast | shadcn/ui deprecated its Toast component | ✓ Good |
| DEC-013: EURAC #C8102E as oklch | oklch(0.48 0.18 27.5) for Tailwind v4 native color system | ✓ Good |
| DEC-014: Prisma 7 PrismaPg adapter only | No datasource url in schema.prisma; connection via adapter | ✓ Good |
| DEC-015: tRPC v11 createCallerFactory | No createHydrationHelpers in v11; direct caller pattern | ✓ Good |
| DEC-016: ESLint FlatCompat wrapper | eslint-config-next v15 + ESLint 9 compatibility | ✓ Good |
| DEC-017: Better Auth model conventions | Session.token, Account.accountId/providerId, Verification model | ✓ Good |
| DEC-018: IncomeInput flat fields | rent1/2/3 + otherIncome1/2/3 instead of JSON for type safety | ✓ Good |
| Glass morphism design system | Professional, accessible; EURAC brand continuity | ✓ Good |
| GSD Full + YOLO mode | 11 phases, 26 plans completed in 3 days with auto-execution | ✓ Good |
| useQueries for batch calculation | Max 3 variants — parallel useQueries simpler than calculateAll | ✓ Good |
| validateVariantInput at tRPC boundary | Runtime safety before engine invocation; BAD_REQUEST on failure | ✓ Good |

---
*Last updated: 2026-03-28 after v1.0 milestone*

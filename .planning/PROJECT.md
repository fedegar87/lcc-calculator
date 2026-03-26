# LCCzero

## What This Is

A web application for Life-Cycle Cost (LCC) analysis of nearly-Zero Energy Buildings (nZEB), replacing the CRAVEzero Excel spreadsheet tool. It calculates total building ownership cost over a reference period (typically 40 years) covering non-construction costs, design, construction, energy, maintenance, residual value, and income-based profitability analysis. Supports a base case + 2 design variants compared side by side.

## Core Value

Accurate, standards-compliant LCC calculations (ISO 15686-5:2017, EN 15459:2018) that replicate the verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Replicate all Excel workbook formulas (discount, energy, maintenance, aggregation)
- [ ] Support formula mode toggle (excel_replica vs excel_bugfixed) with MNT-BUG-001 fix
- [ ] Calculate energy costs for 5 end-use types with correct system counts (2 systems for heating/cooling/DHW, 1 for household/PV)
- [ ] Calculate maintenance with building element flat % and building service EN 15459 replacement cycles
- [ ] Implement residual value per ISO 15686-5 (METHOD_IMPROVEMENT)
- [ ] Implement income/payback/NPV analysis (METHOD_IMPROVEMENT)
- [ ] Support 3 variant comparison (BASE, VARIANT_1, VARIANT_2)
- [ ] Provide construction cost breakdown by 21 categories (A1-E1)
- [ ] Calculate WLC = LCC + non-construction costs with 4-component LCC formula
- [ ] Display KPI ratios and per-m2 indicators
- [ ] User authentication with email/password
- [ ] Project CRUD with multi-user sharing (owner/editor/viewer)
- [ ] 5-step wizard UI (Info, WLC, Construction, Energy, Results)
- [ ] Autosave with debounce
- [ ] Interactive charts (LCC breakdown, cost evolution, variant comparison)
- [ ] PDF and Excel export with result snapshots
- [ ] Glass morphism UI with EURAC brand colors and accessibility compliance

### Out of Scope

- End-of-life / recycling costs (ISO 15686-5 process 6) — not implemented in Excel, defer to v2
- Real-time collaboration (WebSocket) — single-user editing sufficient for v1
- Mobile native app — responsive web is sufficient
- OAuth / social login — email/password sufficient for academic/research context
- Multi-language i18n — English only for v1
- Building energy simulation integration (PHPP) — manual input of energy values

## Context

- **Source of truth:** CRAVEzero Excel workbook (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`) with 7 sheets, ~3000 formula cells
- **Standards:** ISO 15686-5:2017 (LCC structure), EN 15459:2018 (HVAC maintenance data)
- **Critical asymmetry:** Maintenance uses Rint (nominal interest rate), Energy uses RR (real interest rate) — verified in Excel, intentional
- **Known Excel bug:** Maintenance row 62 has `^(I)` instead of `^(I5)` — engine supports both modes
- **Excel gaps:** Residual value (header exists, no formulas) and Income (data collected, never calculated) — implemented as METHOD_IMPROVEMENT
- **Academic context:** EURAC Research / University of Bozen-Bolzano, H2020 CRAVEzero project
- **Prior audit:** Complete formula map with 35+ formulas documented, EN 15459 lookup table extracted

## Constraints

- **Tech stack:** Next.js 14, TypeScript, PostgreSQL, Prisma, tRPC, Auth.js, Recharts, shadcn/ui, Framer Motion, Tailwind CSS
- **Design:** Glass morphism with EURAC brand palette (#C8102E primary), Inter font, WCAG AA accessibility
- **Numeric precision:** Prisma Decimal for DB storage, JS number in engine with controlled rounding at output boundaries
- **GitLab:** Remote at `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`
- **Formula traceability:** Every engine function references formula IDs (FIN-001, NRG-001, etc.)
- **Snapshot reproducibility:** Every export creates an immutable ResultSnapshot with engine version, formula mode, and input hash

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DEC-001: JS number in engine, Decimal in DB | Building LCC precision met by IEEE 754; Decimal prevents accumulation across writes | — Pending |
| DEC-002: Formula mode parameter | Enables traceable deviation from Excel behavior | — Pending |
| DEC-003: Replacement cycle cap (default 3) | Matches Excel IF(OR()) pattern; configurable for generic use | — Pending |
| DEC-004: Year 0 = construction | Verified against Excel Calc!D7; operational costs start year 1 | — Pending |
| DEC-005: Maintenance uses Rint, Energy uses RR | Verified asymmetry in Excel workbook; intentionally replicated | — Pending |
| DEC-006: Residual value (METHOD_IMPROVEMENT) | ISO 15686-5 provision; Excel has header but no formulas | — Pending |
| DEC-007: Income/NPV (METHOD_IMPROVEMENT) | Excel collects data but never calculates; adds analytical value | — Pending |
| DEC-008: Category-to-maintenance mapping | A*=elements(flat%), B*/C*=services(EN15459), D*/E*=none | — Pending |
| DEC-009: Interest rate UX as percentage | Store decimal (0.0151), display percentage (1.51%) in UI | — Pending |
| DEC-010: Site management separate from design | Results!B62: LCC = design + construction + O&M + site_mgmt | — Pending |
| Glass morphism design system | Proven in successful EURAC project; professional, accessible | — Pending |
| GSD Full + YOLO mode execution | 9 phases mapped from 10 TASKs; auto-execute without confirmation | — Pending |

---
*Last updated: 2026-03-26 after initialization*

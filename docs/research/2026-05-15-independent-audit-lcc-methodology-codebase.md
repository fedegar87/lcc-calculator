# Independent audit of LCC methodology, visualization note, and app implementation

Date: 2026-05-15  
Reviewed document: `docs/research/2026-05-14-lcc-methodology-and-visualization.md`  
Reviewed codebase: `c:\llc-calculator-app` working tree as of 2026-05-15  
Reviewer stance: independent evidence audit against external standards, literature, industry sources, and current implementation.

## 1. Executive verdict

The reviewed document is a strong strategic roadmap for turning the current CRAVEzero-derived calculator into a modern, auditable LCC/WLC decision platform. Its main architecture direction is sound: explicit method profiles, cash-flow time series, residual values, scenario-driven energy prices, uncertainty propagation, carbon overlays, reproducible exports, and richer visualization are all defensible.

However, it should not be treated as an implementation specification without correction. Three issues are material:

1. The regulatory baseline is partly outdated as of 2026-05-15. Regulation (EU) No 244/2012 is no longer simply "vigente/integrato"; Commission Delegated Regulation (EU) 2025/2273 repealed it from 2026-01-01 and applies to the next cost-optimal calculations reported by 2028.
2. The Pernetti et al. 2021 paper is mischaracterized in several places. The accessible abstract reports deterministic sensitivity analysis plus Elementary Effects, not Sobol, and identifies a different set of dominant drivers than the reviewed document states.
3. The current app implements only the deterministic core of the roadmap. It does not yet implement uncertainty analysis, carbon/LCSA, cost-optimal primary-energy curves, method profiles, scenario databases, Global Cost per EPBD, IRR/MIRR/SIR/EAC, JSON Schema/REST exports, PDF/A, or the advanced visualization suite.

The document is therefore best classified as a roadmap with several high-value corrections, not as a validated description of the current application.

## 2. Evidence grading

| Area | Audit grade | Reason |
| --- | --- | --- |
| ISO 15686-5 / EN 15459 / EN 16627 framing | High | The core LCC framing, cash-flow transparency, residual values, study period disclosure, and real/nominal distinction are consistent with the standards family. |
| EPBD cost-optimal framing | Medium-high | The cost-optimal concept and macro/financial distinction are correct, but the document must update from 244/2012 to 2025/2273 as the active delegated regulation. |
| Level(s) indicator 6.1 | High | The 50-year reference study period, net present cost, real-cost preference, and LCC/LCA linkage are supported. |
| NIST/FEMP BLCC framing | Medium | BLCC and Handbook 135 are relevant comparators, but the document's "Handbook 135 revision 2025" and "40 years max" wording needs precision against current FEMP/NIST materials. |
| Pernetti et al. 2021 claims | Low | The document's Sobol and "energy 12 percent" claims are not supported by the accessible article metadata/abstract and conflict with the app's own citation metadata. |
| IEA WEO 2025 scenario use | Medium | Using WEO scenarios as scenario families is defensible; exact EU gas/electricity numerical defaults need a versioned data source/table. |
| EU ETS price scenario | Medium | GMK provides a useful market consensus snapshot, but it is not a normative default and should be labelled as a market forecast with uncertainty and ETS-scope caveats. |
| Visualization recommendations | Medium | The chart catalogue is generally appropriate for the proposed data model, but many charts are premature until cost streams, PED, uncertainty, and carbon are implemented. |
| Implementation alignment | Low-medium | The app has a deterministic LCC/WLC engine and basic dashboards/exports, but most proposed layers are absent. |

## 3. External source check

### 3.1 EPBD and delegated cost-optimal methodology

The document correctly identifies Directive (EU) 2024/1275 as the current EPBD recast and gives the transposition deadline of 2026-05-29. The European Commission page confirms entry into force on 2024-05-28 and national transposition by 2026-05-29.

The larger correction is Delegated Regulation (EU) 2025/2273. EUR-Lex states that it establishes the comparative methodology framework for cost-optimal levels, is in force, repeals Regulation 244/2012 as of 2026-01-01, and applies from 2026-01-01 for cost-optimal levels reported to the Commission by 2028-06-30.

Implication for the reviewed document:

- Replace "Reg. 244/2012 vigente, integrato dal pacchetto ... 2025/2273" with "Reg. 244/2012 historical baseline, repealed from 2026-01-01; active framework: Delegated Regulation (EU) 2025/2273."
- Keep 244/2012 in the bibliography only as historical context and for comparison with earlier EPBD cost-optimal reports.
- Rebase the regulatory method profile on 2025/2273, especially for treatment of primary energy, emissions, renewable self-use/export, carbon price developments, and reporting template requirements.

Important detail: 2025/2273 explicitly discusses both macro-economic and financial viewpoints, primary-energy/emission performance, renewable energy produced on site, energy price developments, greenhouse gas allowance costs, and carbon price developments. The document's method-profile architecture is compatible with this, but the citations and default wording need updating.

### 3.2 ISO 15686-5 and Level(s)

ISO's public page confirms ISO 15686-5:2017 remains current, was reviewed and confirmed in 2024, and covers requirements/guidelines for LCC analysis over an agreed period of analysis. That supports the document's emphasis on explicit study period, cash flows, income/externalities only if in scope, and comparison of alternatives.

Level(s) indicator 6.1 strongly supports several document recommendations:

- common LCC/LCCA framing for office and residential buildings;
- use of net present cost;
- discounting over a 50-year reference study period;
- general use of real costs, with nominal costs possible for detailed financial planning;
- linkage to EN 15459, ISO 15686-5, and EN 16627;
- reporting in cost per usable floor area and per year.

The document's default-50-years recommendation is therefore defensible for Level(s) or sustainability-oriented LCCA. It is not automatically the best default for public procurement or EPBD cost-optimal reporting after 2025/2273. The app should expose a method profile rather than one universal default.

### 3.3 NIST/FEMP BLCC

FEMP's current BLCC page says NIST developed BLCC programs, including BLCC, EERC, Handbook 135, and the annual supplement. It also says a web-based BLCC is available to replace the desktop application, with both available until Spring 2026, and that BLCC computes LCC plus comparative economic measures such as net savings, SIR, AIRR, and payback.

The reviewed document should avoid using NIST as a precise EU-methodology authority. It is a useful comparator for:

- deterministic discounted cash-flow structure;
- report reproducibility;
- benchmark validation;
- SIR/AIRR/payback style indicators.

But the document's statement "Handbook 135 revisione 2025" should be verified against the exact DOI/edition being cited. FEMP says the most recent revision was last updated in 2025, while the linked public PDF commonly resolves to NIST Handbook 135-2020. The safest wording is: "NIST Handbook 135 current FEMP material plus current Annual Supplement and BLCC web tool."

### 3.4 EN 15978 status

The document's EN 15978 section is directionally right: EN 15978/EN 16627 are the correct LCA/LCC pair for sustainability-of-construction-works module alignment. Its status wording needs caution. The public search record shows EN 15978 revision activity and national standard pages showing 2025/2026 statuses, while some catalogues still list EN 15978:2011 as current in specific jurisdictions. The document should avoid hard-coding "corrente, in revisione come BS EN 15978-1" without jurisdiction and date.

Recommended wording:

"Use EN 15978:2011/active national adoption where required; monitor EN 15978 revision/adoption status per jurisdiction; keep the app's LCA module versioned by method profile."

### 3.5 Pernetti et al. 2021

This is the largest literature correction.

The reviewed document claims Pernetti et al. 2021 applied Sobol to 11 nZEB European buildings and found analysis horizon, replacement cycle, and discount rate as the three dominant drivers, with energy around 12 percent of LCC.

The accessible University of Bolzano record and abstract say the work compares sensitivity-analysis methodologies, identifies the largest-impact parameters as interest rate, construction and equipment maintenance costs, structural element costs, and electricity prices, and reports LCC variations up to 37 percent with an average of 26 percent around the median. The app's own `src/lib/citations.ts` also describes the paper as using DSA plus Elementary Effects, not Sobol.

Implications:

- Do not cite Pernetti 2021 as evidence that Sobol was applied.
- Do not cite it for "energy is 12 percent of LCC" unless the full paper has a specific table that supports that value and the document names the table/page.
- Use Pernetti 2021 to justify sensitivity screening and practical parameter reduction.
- Use Saltelli et al. and broader global SA literature to justify Sobol as a future enhancement, not as a result already demonstrated in the CRAVEzero paper.

### 3.6 Uncertainty and Sobol/Monte Carlo proposal

The proposed sequence is methodologically reasonable:

1. deterministic baseline;
2. Morris/Elementary Effects screening;
3. optional Sobol first-order/total-order indices;
4. Monte Carlo or LHS for output distributions and P10/P50/P90.

Two caveats:

- The runtime target of less than 30 seconds for Sobol plus 5,000 LHS samples is not justified by the current app. The current engine is small and pure, but no profiling exists for large WBS, multiple variants, stochastic replacement schedules, or server/client worker overhead.
- Distribution defaults for costs, service lives, energy escalation, and rates should be marked as editorial defaults until backed by a versioned empirical source.

### 3.7 Energy prices and IEA WEO 2025

IEA WEO 2025 supports use of named scenario families such as STEPS and CPS. The accessible overview describes the scenario distinction and broad fossil-fuel trajectory differences. It does not, from the accessible page alone, verify the reviewed document's exact numerical claims for EU gas and electricity escalation. Those numbers may be in the full report/data tables, but the app should not embed them without:

- source table ID/version;
- carrier, geography, sector, currency base year, tax treatment;
- conversion from projected prices to annual escalation vectors;
- scenario name and publication date.

Current app support is far simpler: each energy source has a single `annualIncrease` scalar. That cannot represent WEO scenario curves, country-level prices, price caps, fuel switching, feed-in tariffs, or time-varying carbon cost.

### 3.8 EU ETS carbon price

GMK's 2025 consensus forecast is a useful market source: it reports an average EU ETS price forecast of 85 EUR/t in 2026 and 126 EUR/t in 2030, with institutional forecasts ranging around 80-147 EUR/t. This supports using 126 EUR/t as a scenario datapoint, not as a default normative value.

The reviewed document should label ETS prices as:

- market forecast;
- source and publication date;
- EUA/ETS scope specific;
- separate from the legal minimum/baseline carbon-cost assumptions in older EPBD methodology.

## 4. Codebase comparison

### 4.1 What the current app implements

The app is a deterministic Next.js/tRPC/Prisma LCC/WLC calculator with:

- `ENGINE_VERSION = "1.0.0"` and formula modes `excel_replica` and `excel_bugfixed` in `src/engine/types.ts`.
- Validated scalar inputs for reference period, nominal interest rate, inflation, energy prices, cost items, service components, WLC fields, and optional income in `src/engine/types.ts` and `src/engine/validation.ts`.
- Real-rate calculation in `src/engine/discount.ts`, including an Excel replica denominator and a corrected Fisher-equivalent mode.
- Energy costs from per-carrier annual escalation scalars in `src/engine/energy.ts`.
- Building-element maintenance as one global annual percentage and service maintenance/replacement from EN 15459 service-component data in `src/engine/maintenance.ts`.
- Residual value for service components using prorated remaining life in `src/engine/residual.ts`.
- Aggregated LCC/WLC and KPIs in `src/engine/aggregate.ts`.
- Deterministic SHA-256 snapshots for reproducibility in `src/server/export/snapshot.ts`.
- Basic PDF and Excel exports in `src/server/export/pdf-document.tsx` and `src/server/export/excel-workbook.ts`.
- Recharts-based dashboard views in `src/components/results/`.

This is a useful deterministic foundation. It is not yet the architecture described in the reviewed document.

### 4.2 Major missing layers from the roadmap

| Roadmap item in reviewed document | Current code status |
| --- | --- |
| `CostStream(category, year_t, amount_t, currency, real_or_nominal, source)` as primary output | Not implemented. Engine returns fixed arrays and aggregates, not typed cash-flow ledger rows. |
| JSON Schema Draft 2020-12 API plus REST and tRPC | Not implemented. Validation is Zod/TypeScript; tRPC exists; no JSON Schema or REST export contract. |
| Method profiles for EPBD/Level(s)/NIST/custom | Not implemented. Formula mode only controls Excel replica vs bugfixed math. |
| Financial vs social/macro discount rates | Not implemented. Single nominal rate plus inflation. |
| Discount-rate/source table | Not implemented in Prisma. |
| Energy scenario database | Not implemented. Single annual escalation per energy source. |
| PV self-consumption vs export tariffs | Not implemented. PV is a negative energy-cost stream using fixed source index 13. |
| Storage degradation/losses | Not implemented. |
| Maintenance by category/activity plan | Partially implemented for services; building elements have one global percent. |
| Morris/Sobol/Monte Carlo/LHS | Not implemented. No statistical/worker dependencies. |
| Carbon intensity, LCA modules, carbon shadow price | Not implemented. |
| EPBD Global Cost / cost-optimal x-y curve | Not implemented. No primary-energy-demand input/output. |
| Discounted payback, IRR, MIRR, SIR, EAC | Mostly not implemented. App has simple payback/income outputs, but not the full indicator set. |
| PDF/A compliance report | Not implemented. Current PDF is a small react-pdf report. |
| Analyst/scientific chart suite | Mostly not implemented. Current dashboard uses basic bar/line/card views. |

### 4.3 Current implementation divergences and defects

#### Off-by-one reporting of years

Engine arrays include year 0 plus years 1..N. That is a valid computational convention. Several presentation layers display the array length directly or map index 0 to "Year 1":

- `src/server/export/pdf-document.tsx` displays `result.heatingCosts.cumulated.length` as the number of years. For a 40-year period this prints 41 years.
- `src/server/export/excel-workbook.ts` uses `years = result.heatingCosts.cumulated.length` and writes rows `i + 1`, so year 0 is labelled year 1 and the workbook emits N+1 displayed years.
- `src/components/results/charts/cost-evolution-line.tsx` maps `year: i + 1`, so year 0 appears as year 1 and the final displayed year is N+1.

This should be fixed before any methodology/reporting certification work. Display year should be `i`, or the UI should intentionally omit index 0 and label years 1..N.

#### Hard-coded dashboard assumptions are stale

`src/components/results/results-dashboard.tsx` contains visible assumptions that say:

- NPV is computed over a 40-year analysis period;
- end-of-life costs are excluded by default;
- Pernetti 2021 balances life-cycle perspective and forecast reliability;
- energy escalation times interest rate is the strongest non-linear driver.

These are not reliably true for the current app:

- reference period is user-configurable;
- residual value is implemented;
- income/NPV terminology is separate from LCC/WLC and not equivalent to EPBD Global Cost;
- the Pernetti claims need correction as above.

#### Default-period inconsistency

The persisted/demo data default is 40 years, 1.51 percent interest, and 0.56 percent inflation in `prisma/schema.prisma` and `prisma/seed-data/shared.ts`. The WLC form falls back to 30 years, 3 percent interest, and 2 percent inflation if no boundary condition exists.

This may be intentional, but if not explicitly documented it weakens reproducibility and method transparency. A method profile should own these defaults.

#### Residual-value boundary convention

`src/engine/residual.ts` computes `remainingLife = lifespan - (referencePeriod % lifespan)`, so if the reference period is exactly divisible by component life, the residual fraction is 1.0. That can be correct only if the replacement occurs at the end of the final year and the newly installed component remains fully valuable at analysis close. It should be documented as a cash-flow timing convention. If the method profile treats replacement at the beginning of the period/year, the fraction may need adjustment.

#### Maintenance discounting asymmetry

The engine discounts maintenance using nominal interest rate, while energy uses real-rate machinery and explicit energy escalation. This is documented as CRAVEzero spreadsheet inheritance in code and dashboard assumptions. The roadmap's future method profiles should make this a selectable convention, not an implicit universal rule.

### 4.4 Visualization gap

The reviewed document proposes 20 chart types and a Recharts + ECharts + Plotly stack. The current dependency set contains Recharts, not ECharts or Plotly. Current implemented views are:

- KPI cards;
- LCC/WLC breakdown bars;
- cost-evolution line;
- construction breakdown;
- variant comparison bars/tables;
- basic export images.

The proposed chart suite is data-model dependent. For example:

- cost-optimal scatter needs primary energy demand and Global Cost;
- treemap/waterfall/Sankey need a cost-stream ledger;
- tornado/Sobol need uncertainty outputs;
- violin/CDF/fan charts need sampled distributions;
- MAC curves need carbon and abatement deltas.

Recommendation: do not add ECharts/Plotly until the corresponding engine outputs exist. Recharts is enough for the current deterministic dashboard and for a first cost-optimal scatter if the data model is added.

## 5. Recommended corrections to the reviewed document

### 5.1 High-priority textual corrections

1. Update all references to Regulation 244/2012 as the active framework. State that 2025/2273 is now the active delegated regulation and 244/2012 is repealed from 2026-01-01.
2. Correct Pernetti 2021 wherever it is cited as Sobol evidence. Replace with DSA plus Elementary Effects unless a full-text page/table is cited that proves otherwise.
3. Remove or qualify the "energy about 12 percent of LCC" statement. The accessible abstract reports variations up to 37 percent and average 26 percent around the median; it does not support the 12 percent claim.
4. Change "Handbook 135 revision 2025" to precise NIST/FEMP wording tied to the DOI/edition and annual supplement.
5. Reword EN 15978 status as jurisdiction/version dependent and method-profiled.
6. Reclassify IEA WEO and ETS figures as versioned scenario inputs, not embedded universal defaults.

### 5.2 High-priority implementation corrections

1. Fix year labelling in PDF, Excel, and cost-evolution chart.
2. Replace hard-coded dashboard assumption text with dynamic text sourced from the actual boundary condition and formula/method mode.
3. Consolidate defaults into a method profile or single constants source.
4. Add a `methodVersion`/`methodProfile` field to calculation input/output and exports, separate from `formulaMode`.
5. Add explicit Global Cost fields only after the EPBD 2025/2273 calculation profile is defined.

### 5.3 Architecture sequence

A low-risk implementation sequence would be:

1. Method metadata and reporting fixes: profile ID, source versions, reference period display, dynamic assumptions.
2. Cash-flow ledger: emit typed rows for initial, annual, periodic, residual, energy, maintenance, income, and optional externalities.
3. EPBD/Level(s) profile layer: default period, area basis, cost boundaries, discount convention, scenario requirements, PED/carbon placeholders.
4. Cost-optimal deterministic view: primary-energy-demand input/output, Global Cost per square metre, variant scatter/frontier.
5. Scenario-rate catalog: country, carrier, source, year, price, carbon price, version, publication date.
6. Uncertainty layer: Morris first, LHS/Monte Carlo for distributions second, Sobol only after profiling.
7. Carbon/LCSA overlay: EN 15978/EN 16627 module mapping, EPD/default source metadata, shadow-price scenario.
8. Export certification: JSON Schema, report manifest, PDF/A path if required, validation cases.

## 6. Source links used

- European Commission, Energy Performance of Buildings Directive: https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficient-buildings/energy-performance-buildings-directive_en
- EUR-Lex, Directive (EU) 2024/1275: https://eur-lex.europa.eu/eli/dir/2024/1275/oj
- EUR-Lex, Delegated Regulation (EU) 2025/2273: https://eur-lex.europa.eu/eli/reg_del/2025/2273/oj/eng
- EUR-Lex, Delegated Regulation (EU) No 244/2012: https://eur-lex.europa.eu/eli/reg_del/2012/244/oj/eng
- ISO 15686-5:2017 public record: https://www.iso.org/standard/61148.html
- JRC Level(s) indicator 6.1 v1.1 PDF: https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/2021-01/UM3_Indicator_6.1_v1.1_21pp.pdf
- FEMP/NIST BLCC programs: https://www.energy.gov/femp/building-life-cycle-cost-programs
- Pernetti, Garzia, Filippi Oberegger 2021 record/DOI: https://bia.unibz.it/esploro/outputs/journalArticle/Sensitivity-analysis-as-support-for-reliable/991006255498101241 and https://doi.org/10.1016/j.scs.2021.103139
- IEA World Energy Outlook 2025 overview: https://www.iea.org/reports/world-energy-outlook-2025/overview-and-key-findings
- GMK Center EU ETS consensus forecast: https://gmk.center/en/infographic/carbon-price-in-the-eu-ets-to-hit-e126-t-by-2030/
- One Click LCA LCC product/help references: https://help.oneclicklca.com/en/articles/275919-life-cycle-costing-tool-assessment-scope-database-parameters and https://oneclicklca.com/en-us/software/design-construction/life-cycle-costing

## 7. Bottom line

The reviewed document is valuable, but its strongest use is as a phased modernization brief. Before implementation, correct the regulatory baseline, fix the Pernetti citation, separate standards-supported requirements from editorial defaults, and align the app around explicit method profiles. The current app can support that path, but its present behavior is much narrower than the document's target architecture.

# Feature Research

**Domain:** Life-Cycle Cost (LCC) / Whole Life Cost (WLC) analysis for nearly-Zero Energy Buildings (nZEB)
**Researched:** 2026-03-26
**Confidence:** HIGH (based on ISO 15686-5:2017, EN 15459:2018, competitor analysis of NIST BLCC, One Click LCA, eTool/Cerclos, CRAVEzero Excel tool, and WBDG/LCCA guidance)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **ISO 15686-5 LCC cost structure** | The standard defines cost categories (non-construction, design, construction, O&M, end-of-life). Every LCC tool follows this. Users verify results against the standard. | HIGH | Must implement: non-construction costs, design costs, construction costs (21 categories A1-E1), energy costs, maintenance costs, residual value. End-of-life deferred per PROJECT.md. |
| **Net Present Value (NPV) discounting** | Core of LCC methodology. Converting future costs to present value via discount rate is the entire point. BLCC, One Click LCA, CRAVEzero all do this. | MEDIUM | Requires correct discount factor formula: `1/(1+r)^n`. Support both real and nominal discount rates. The Excel tool uses Rint for maintenance and RR for energy (DEC-005). |
| **Variant comparison (side-by-side)** | BLCC calculates "comparative economic measures for alternative designs." CRAVEzero supports base + variant. One Click LCA compares design alternatives. This is how LCC informs decisions. | MEDIUM | 3 variants (BASE, VARIANT_1, VARIANT_2) per PROJECT.md. Visual side-by-side with delta values. |
| **Construction cost breakdown** | CRAVEzero uses European Code of Measurement categories. One Click LCA breaks down by material/assembly. Users need to see where money goes. | MEDIUM | 21 categories (A1-E1) mapped to maintenance types (DEC-008). Category-level input with subtotals. |
| **Energy cost calculation** | Every LCC tool includes operational energy. BLCC is "especially useful for evaluating costs and benefits of energy conservation." CRAVEzero calculates by end-use type. | HIGH | 5 end-use types (heating, cooling, DHW, household electricity, PV). Correct system counts (2 for heating/cooling/DHW, 1 for household/PV). Energy price escalation over reference period. |
| **Maintenance cost calculation** | EN 15459:2018 provides standard maintenance percentages for HVAC. CRAVEzero uses "standard values from EN 15459:2018, which provides yearly maintenance costs for each element." All LCC tools include this. | HIGH | Two methods: building element flat % and building service EN 15459 replacement cycles. Replacement cycle cap (DEC-003, default 3). |
| **Results visualization (charts)** | CRAVEzero has a dedicated Charts sheet. BLCC produces comparative graphs. One Click LCA generates visual reports. Researchers need charts for publications and presentations. | MEDIUM | LCC breakdown (pie/bar), cost evolution over time (line), variant comparison (grouped bar). Interactive with hover details. |
| **Export (PDF and Excel)** | CRAVEzero is an Excel tool (inherently exportable). One Click LCA generates "a life-cycle costing report template." BLCC produces printable reports. Academic users must embed results in papers and reports. | MEDIUM | PDF with charts + summary tables. Excel with raw data for further analysis. Must include input parameters for reproducibility. |
| **KPI indicators (cost per m2)** | Standard metric in building economics. CRAVEzero reports per-m2 values. One Click LCA normalizes by area. Enables comparison across buildings of different sizes. | LOW | LCC/m2, WLC/m2, energy cost/m2, maintenance cost/m2. Simple division by gross floor area. |
| **User authentication** | Web application baseline. Users have private project data with financial figures. | LOW | Email/password per PROJECT.md. No OAuth needed for academic context. |
| **Project CRUD** | Users create multiple analyses for different buildings/scenarios. Every web-based tool supports this. | LOW | Create, read, update, delete projects. List view with basic metadata. |
| **Autosave** | Web users expect not to lose work. Loss of complex input data (21 cost categories, energy parameters, maintenance tables) would be catastrophic. | LOW | Debounced autosave per PROJECT.md. Visual save indicator. |
| **WLC calculation (LCC + non-construction)** | ISO 15686-5 defines WLC = LCC + non-construction costs. CRAVEzero's Excel has a dedicated WLC sheet. This is the complete financial picture. | MEDIUM | 4-component LCC formula within WLC. Non-construction costs (land, enabling, fees, finance). |
| **Configurable reference period** | Standard LCC practice. BLCC lets users set study period. CRAVEzero defaults to 40 years. Users must adjust for building type. | LOW | Default 40 years, user-configurable. Affects all discounting and replacement cycle calculations. |
| **Interest rate / discount rate input** | Every LCC tool requires this. BLCC embeds FEMP discount rates. CRAVEzero collects it as input. Critical parameter that significantly affects results. | LOW | Display as percentage, store as decimal (DEC-009). Support both real and nominal rates. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Formula mode toggle (excel_replica vs excel_bugfixed)** | No competitor offers this. Enables research traceability: users can reproduce exact Excel results, then switch to corrected formulas (MNT-BUG-001). Critical for academic validation and publication. | MEDIUM | Two formula paths in the engine. Every calculation references formula IDs (FIN-001, NRG-001, etc.) for traceability. Unique in the domain. |
| **Residual value calculation** | ISO 15686-5 defines it but CRAVEzero's Excel has "header but no formulas." BLCC includes it. One Click LCA includes end-of-life. Filling this gap adds analytical completeness. | MEDIUM | METHOD_IMPROVEMENT. Calculates remaining value of building components at end of reference period based on remaining service life. |
| **Income / payback / NPV profitability analysis** | CRAVEzero "collects data but never calculates." BLCC calculates net savings, SIR, AIRR, and payback. This bridges the gap from cost analysis to investment decision support. | HIGH | METHOD_IMPROVEMENT. Revenue streams (e.g., PV electricity feed-in), payback period, NPV of net cash flows, savings-to-investment ratio. Transforms tool from cost calculator to investment analyzer. |
| **Result snapshots with immutable audit trail** | No competitor in this niche offers immutable snapshots. Academic reproducibility requires knowing exact inputs, engine version, and formula mode that produced a result. Critical for publications. | MEDIUM | Snapshot includes: engine version, formula mode, input hash, timestamp, all calculated results. Enables "show me exactly how this number was computed." |
| **Multi-user project sharing (owner/editor/viewer)** | CRAVEzero Excel is single-user (file sharing only). BLCC desktop was single-user. Web-based sharing with role permissions enables team collaboration without version conflict. | MEDIUM | Three roles. Owner manages access. Editors modify data. Viewers see results. No real-time collaboration needed (single-user editing sufficient). |
| **5-step wizard UI** | CRAVEzero Excel has 6 worksheets with no guided flow. BLCC is a form-heavy Java app. A wizard reduces cognitive load for a complex domain with ~50+ input parameters. | MEDIUM | Info -> WLC -> Construction -> Energy -> Results. Progressive disclosure. Step validation before advancing. Reduces error rate vs free-form input. |
| **Sensitivity analysis (what-if on key parameters)** | Research shows "discount rate, maintenance costs and electricity prices" are the parameters that "mainly affect the LCC in nZEB case studies." BLCC does not include built-in sensitivity. CRAVEzero does not either. | HIGH | Vary discount rate, energy prices, or maintenance % and see impact on LCC. Tornado chart showing parameter sensitivity. One-at-a-time (OAT) approach is sufficient for v1. |
| **EN 15459 lookup table embedded** | CRAVEzero requires manual lookup of HVAC maintenance data from the standard. Embedding the table with autocomplete eliminates a tedious, error-prone step. | LOW | ~50 rows of HVAC component data (lifespan, maintenance %, inspection intervals). Already extracted in prior audit. Searchable/filterable in UI. |
| **Glass morphism design with accessibility** | Existing tools (BLCC, CRAVEzero) have dated UIs. One Click LCA has modern UI but is a general-purpose commercial product. A polished, branded academic tool differentiates in the nZEB research community. | MEDIUM | EURAC brand colors (#C8102E), Inter font, WCAG AA. Stands out in conference demos and publications. Not just "another Excel replacement." |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **BIM/IFC import** | "Automate data entry from building model." Commercial tools like One Click LCA do this. | Massive complexity (IFC parsing, material mapping, geometry interpretation). Our users input ~50 parameters manually from PHPP/design documents. The bottleneck is not data entry volume but domain understanding. | Manual input with clear field labels and EN 15459 lookup table. Consider CSV import for batch data in v2+. |
| **Real-time collaboration (WebSocket)** | "Multiple users editing simultaneously like Google Docs." | LCC analysis is a sequential, reflective process, not a collaborative editing task. One person runs the analysis; others review results. WebSocket adds infrastructure complexity for zero real-world benefit. | Project sharing with roles (owner/editor/viewer). One editor at a time. Share results via export. |
| **End-of-life / recycling costs** | ISO 15686-5 process 6 includes demolition and recycling. Some tools implement it. | CRAVEzero Excel never implemented it. Data for end-of-life costs in the nZEB context is unreliable (40+ year projections for demolition costs). Adding it now would block launch for speculative calculations. | Defer to v2. Document the omission clearly. Allow manual "other costs" field if users want to approximate. |
| **Monte Carlo simulation** | Academic literature uses Monte Carlo for probabilistic LCC. Sounds impressive. | Requires probability distributions for every input parameter (users rarely have this data). Computational cost. Complex UI for defining distributions. OAT sensitivity analysis covers 90% of the research use case. | One-at-a-time sensitivity analysis for v1. Monte Carlo as a v2+ research feature if demand materializes. |
| **Energy simulation integration (PHPP/EnergyPlus)** | "Auto-calculate energy demand from building physics model." | Couples two complex domains. PHPP is proprietary. EnergyPlus requires detailed building geometry. Our users already have energy values from their simulation tools. | Manual input of energy demand values. Clear field units and validation. |
| **Multi-language i18n** | "Support German, Italian, English for European researchers." | Internationalization of domain-specific terms (financial, building physics, standards) is error-prone and time-consuming. ISO standards use English terminology. | English only for v1. Standard terminology follows ISO/EN naming. |
| **Mobile native app** | "Access on-site from phone/tablet." | LCC analysis requires detailed data entry and chart interpretation. Small screens make this painful. No one runs LCC analysis on a phone. | Responsive web design that works on tablets in landscape mode. Desktop-first. |
| **OAuth / social login** | "Sign in with Google/Microsoft." | Adds OAuth provider dependencies, consent flows, and account linking complexity. Academic users are comfortable with email/password. Small user base doesn't justify the abstraction. | Email/password authentication. Add OAuth only if user base grows beyond academic context. |
| **Cost database with regional pricing** | One Click LCA has "250,000 verified datasets." Users want pre-filled construction costs. | Building a cost database is a separate product. Costs vary by region, year, supplier. Maintaining accuracy is a full-time job. Our users have project-specific costs from tender documents. | User-provided cost inputs. Template projects with sample data for onboarding. |

## Feature Dependencies

```
[User Authentication]
    +-- [Project CRUD]
        +-- [Autosave]
        +-- [Multi-user Sharing] (requires roles on projects)
        +-- [Result Snapshots] (requires project to attach to)

[Construction Cost Breakdown (21 categories)]
    +-- [Category-to-maintenance Mapping (DEC-008)]
        +-- [Maintenance Cost Calculation]
            +-- [EN 15459 Lookup Table] (enhances maintenance input)

[Interest Rate / Discount Rate Input]
    +-- [NPV Discounting]
        +-- [Energy Cost Calculation] (uses RR)
        +-- [Maintenance Cost Calculation] (uses Rint)
        +-- [Residual Value Calculation]
        +-- [WLC Calculation]
            +-- [Variant Comparison]
                +-- [KPI Indicators]
                +-- [Results Visualization]
                    +-- [Export PDF/Excel]
                    +-- [Result Snapshots]

[Formula Mode Toggle]
    +-- affects all calculation modules (cross-cutting concern)

[Income / Payback / NPV Analysis]
    +-- requires [NPV Discounting]
    +-- requires [Energy Cost Calculation] (for savings calculation)

[Sensitivity Analysis]
    +-- requires [complete LCC engine] (all cost modules)
    +-- requires [Results Visualization] (for tornado/spider charts)
```

### Dependency Notes

- **Construction cost breakdown requires category-to-maintenance mapping:** The 21 cost categories (A1-E1) feed directly into maintenance calculation logic. A* categories use flat percentage; B*/C* categories use EN 15459 replacement cycles; D*/E* categories have no maintenance. This mapping must exist before maintenance can work.
- **Formula mode toggle is cross-cutting:** It affects maintenance (MNT-BUG-001 fix), and potentially other formulas. It must be designed as an engine-level parameter, not retrofitted per module.
- **Income analysis requires energy calculation:** Payback and NPV of investments depend on energy savings compared to a baseline, which requires the energy cost module to be complete.
- **Sensitivity analysis requires complete engine:** You cannot vary parameters and observe LCC impact until all cost modules are calculating correctly. This must be the last analytical feature built.
- **Export requires visualization:** PDF export embeds charts. Excel export includes computed results. Both require the results/visualization layer to be complete.

## MVP Definition

### Launch With (v1)

Minimum viable product -- replaces the CRAVEzero Excel with a web application that produces identical (or explicitly improved) results.

- [ ] **ISO 15686-5 LCC cost structure with all cost categories** -- without this, it's not an LCC tool
- [ ] **NPV discounting with real/nominal rate support** -- the core calculation methodology
- [ ] **Construction cost breakdown (21 categories)** -- mirrors Excel's granularity
- [ ] **Energy cost calculation (5 end-use types)** -- major operational cost driver
- [ ] **Maintenance cost calculation (flat % + EN 15459 replacement cycles)** -- second major operational cost driver
- [ ] **WLC = LCC + non-construction costs** -- complete financial picture per ISO 15686-5
- [ ] **Formula mode toggle** -- key differentiator for academic credibility (can reproduce Excel exactly)
- [ ] **3-variant comparison** -- the primary use case for LCC (which design option is cheapest?)
- [ ] **Results visualization (3 chart types)** -- users cannot interpret raw numbers alone
- [ ] **KPI indicators (per-m2 ratios)** -- standard comparison metric
- [ ] **User authentication + project CRUD** -- basic web app functionality
- [ ] **Autosave** -- prevent data loss on complex inputs
- [ ] **Export (PDF + Excel)** -- users must extract results for reports and publications
- [ ] **5-step wizard UI** -- guided flow reduces errors vs CRAVEzero's unstructured Excel sheets

### Add After Validation (v1.x)

Features to add once core LCC engine is verified against Excel outputs.

- [ ] **Residual value calculation** -- add once maintenance and energy modules are verified stable
- [ ] **Income / payback / NPV analysis** -- add once users confirm interest in investment analysis beyond pure cost comparison
- [ ] **Result snapshots with audit trail** -- add once export is stable and users request reproducibility features
- [ ] **Multi-user project sharing** -- add once more than single-user workflows emerge
- [ ] **EN 15459 lookup table (embedded, searchable)** -- add to improve UX for maintenance data entry
- [ ] **Sensitivity analysis (OAT)** -- add once engine is stable and users request what-if capabilities

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Monte Carlo probabilistic analysis** -- only if research community demands it
- [ ] **End-of-life / recycling costs** -- when reliable data and methodology become available
- [ ] **CSV/batch data import** -- if users need to import from other tools
- [ ] **Template projects / sample data** -- for onboarding new users
- [ ] **API for programmatic access** -- if integration with other research tools is needed
- [ ] **Multi-language support** -- only if user base expands beyond English-speaking researchers

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| ISO 15686-5 LCC cost structure | HIGH | HIGH | P1 |
| NPV discounting | HIGH | MEDIUM | P1 |
| Construction cost breakdown (21 categories) | HIGH | MEDIUM | P1 |
| Energy cost calculation (5 end-use types) | HIGH | HIGH | P1 |
| Maintenance cost calculation (EN 15459) | HIGH | HIGH | P1 |
| WLC calculation | HIGH | MEDIUM | P1 |
| Formula mode toggle | HIGH | MEDIUM | P1 |
| 3-variant comparison | HIGH | MEDIUM | P1 |
| Results visualization (charts) | HIGH | MEDIUM | P1 |
| KPI indicators (per-m2) | MEDIUM | LOW | P1 |
| User authentication | MEDIUM | LOW | P1 |
| Project CRUD + autosave | MEDIUM | LOW | P1 |
| Export (PDF + Excel) | HIGH | MEDIUM | P1 |
| 5-step wizard UI | MEDIUM | MEDIUM | P1 |
| Residual value calculation | MEDIUM | MEDIUM | P2 |
| Income / payback / NPV analysis | MEDIUM | HIGH | P2 |
| Result snapshots | MEDIUM | MEDIUM | P2 |
| Multi-user sharing | LOW | MEDIUM | P2 |
| EN 15459 embedded lookup | MEDIUM | LOW | P2 |
| Sensitivity analysis (OAT) | MEDIUM | HIGH | P2 |
| Glass morphism UI polish | MEDIUM | MEDIUM | P2 |
| Monte Carlo simulation | LOW | HIGH | P3 |
| End-of-life costs | LOW | MEDIUM | P3 |
| CSV import | LOW | LOW | P3 |
| Template projects | LOW | LOW | P3 |
| Multi-language (i18n) | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (replaces Excel with verified equivalent)
- P2: Should have, add after core engine is stable (extends beyond Excel capabilities)
- P3: Nice to have, future consideration (only if demand materializes)

## Competitor Feature Analysis

| Feature | NIST BLCC | One Click LCA | CRAVEzero Excel | eTool/Cerclos | Our Approach |
|---------|-----------|---------------|-----------------|---------------|--------------|
| LCC calculation | Yes (FEMP-focused, 5 US-specific modules) | Yes (integrated with LCA) | Yes (ISO 15686-5 + EN 15459) | Yes (ISO 15686-5) | ISO 15686-5 + EN 15459, nZEB-focused |
| Discount/NPV | Yes | Yes (discounted + nominal) | Yes (Rint + RR) | Yes | Dual rate (Rint/RR) matching Excel |
| Variant comparison | Yes (alternative designs) | Yes (design alternatives) | Base + 1 variant | Limited | Base + 2 variants (3 total) |
| Energy costs | Yes (energy escalation rates) | Yes (from energy models) | Yes (5 end-use types) | Yes | 5 end-use types, matching Excel |
| Maintenance | Limited | Yes (from material database) | Yes (EN 15459 HVAC) | Yes (from templates) | EN 15459 replacement cycles + flat % |
| Residual value | Yes | Yes (end-of-life) | Header only, no formulas | Yes | METHOD_IMPROVEMENT (fills Excel gap) |
| Income/payback | Yes (net savings, SIR, AIRR, payback) | No | Data collected, never calculated | No | METHOD_IMPROVEMENT (fills Excel gap) |
| Sensitivity analysis | No built-in | No | No | No | OAT sensitivity (differentiator) |
| Formula traceability | No | No | No (black box formulas) | No | Formula IDs + mode toggle (unique) |
| Result snapshots | No | Report templates | No | Report export | Immutable snapshots with input hash |
| Cost database | Yes (FEMP energy prices) | Yes (250K+ datasets, BKI, Spon's) | No (user-provided) | Yes (templates) | No (user-provided, like Excel) |
| BIM integration | No | Yes (Revit, IFC, gbXML) | No | Yes (IFC) | No (manual input, deliberate choice) |
| Standards compliance | US federal (10 CFR 436) | EN 16627, ISO 15686-5, NS 3454 | ISO 15686-5, EN 15459 | ISO 15686-5, EN 15978 | ISO 15686-5, EN 15459 |
| Platform | Web (new, replacing Java desktop) | Web (SaaS) | Excel (.xlsm) | Web (SaaS) | Web (Next.js) |
| Target users | US federal agencies | Global construction industry | European nZEB researchers | Global architects/engineers | European nZEB researchers/engineers |
| Pricing | Free (government) | Commercial SaaS | Free (research) | Commercial SaaS | Free (academic, open research) |
| UI quality | Basic (government tool) | Modern (commercial SaaS) | Excel (worksheets) | Modern (commercial SaaS) | Glass morphism + EURAC branding |

## Sources

- [NIST BLCC Programs](https://www.nist.gov/services-resources/software/building-life-cycle-cost-programs) -- BLCC features, web version transition, economic measures (HIGH confidence)
- [DOE FEMP Building Life Cycle Cost Programs](https://www.energy.gov/cmei/femp/building-life-cycle-cost-programs) -- BLCC modules, energy escalation calculator (HIGH confidence)
- [One Click LCA Life-Cycle Costing](https://oneclicklca.com/software/design-construction/life-cycle-costing) -- Features, standards, cost databases (HIGH confidence)
- [eTool/Cerclos Features](http://cerclos.com/products/etool/features/) -- ISO compliance, LCC reporting (MEDIUM confidence)
- [eTool LCC and ISO 15686 Reporting](https://support.etool.app/index.php/knowledgebase/life-cycle-cost-lcc-and-iso15686-reporting/) -- Template system, reporting automation (MEDIUM confidence)
- [CRAVEzero LCC Tool](https://www.cravezero.eu/pinboard/Downloads/LCCTool.htm) -- Excel tool features, cost categories, 6 worksheets (HIGH confidence)
- [CRAVEzero LCC Web Tool Info](https://www.cravezero.eu/pboard/LCC/LCCInfo.htm) -- Simplified web version, ISO 15686-5 structure (HIGH confidence)
- [WBDG Life-Cycle Cost Analysis](https://www.wbdg.org/resources/life-cycle-cost-analysis-lcca) -- LCC formula, cost categories, sensitivity analysis methodology (HIGH confidence)
- [ISO 15686-5:2017](https://www.iso.org/standard/61148.html) -- Standard definition of LCC cost structure (HIGH confidence)
- [CRAVEzero D2.3: Structured Repository of Existing LCC Tools](https://www.cravezero.eu/wp-content/uploads/2018/09/CRAVEzero_D23_Structured-Repository-of-existing-LCC-calculation-tools.pdf) -- Competitor landscape in nZEB LCC domain (MEDIUM confidence, PDF partially readable)
- [Sensitivity analysis for nZEB LCC](https://www.sciencedirect.com/science/article/abs/pii/S2210670721004212) -- Key parameters affecting LCC in nZEB case studies (MEDIUM confidence)
- [NIST Handbook 135 (2020)](https://nvlpubs.nist.gov/nistpubs/hb/2020/NIST.HB.135-2020.pdf) -- Life Cycle Costing Manual for FEMP (HIGH confidence)

---
*Feature research for: LCC/WLC analysis of nearly-Zero Energy Buildings*
*Researched: 2026-03-26*

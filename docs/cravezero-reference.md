# CRAVEzero Reference — Landing Page Source Material

> Source material collected from the CRAVEzero project web platform (cravezero.eu) and related publications.
> Intended use: feed the LCC calculator app's landing page / about section with accurate, verifiable project background and case-study data.
> Last updated: 2026-04-19

---

## 1. Project at a glance

**Full name:** *Cost Reduction and market Acceleration for Viable nearly zero-Energy buildings* (CRAVEzero)

**Funding programme:** European Commission — Horizon 2020 (Research & Innovation Action)
**Grant Agreement No.:** 741223
**Duration:** September 2017 – August 2020 (36 months)
**Coordinator:** AEE INTEC — *Arbeitsgemeinschaft Erneuerbare Energie – Institut für Nachhaltige Technologien* (Austria)
**Project leader:** Tobias Weiß (AEE INTEC)

**Tagline / elevator pitch:**
> CRAVEzero focuses on proven and new approaches to reduce the costs of nearly zero-energy buildings (nZEBs) at all stages of the life cycle — from urban planning to operation — by eliminating extra expenses linked to processes, technologies and building operation, and by promoting innovative business models that create win-win situations for all stakeholders.

**Policy driver:**
EU Energy Performance of Buildings Directive (EPBD, 2010/31/EU revised by 2018/844/EU) requires all **new public buildings to be nZEB from 2019** and **all new buildings to be nZEB from 2021**. CRAVEzero responds to this mandate by closing the cost gap.

---

## 2. Consortium

| Organisation | Country | Role |
|---|---|---|
| AEE INTEC | Austria | Coordinator, research institute |
| EURAC Research — Institute for Renewable Energy | Italy | Research institute (LCC methodology, case studies, pinboard) |
| Fraunhofer ISE | Germany | Research institute (technology assessment, LCC methodology) |
| Bouygues Construction | France | Construction company |
| Skanska Sverige AB | Sweden | Construction company |
| ATP sustain GmbH | Germany / Austria | Integrated planning, sustainability consulting |
| Moretti S.p.A. | Italy | Construction / prefabrication |
| Köhler & Meinzer GmbH | Germany | Construction |
| 3i efficientamento energetico s.r.l. | Italy | Energy-efficiency SME |

---

## 3. CRAVEzero methodology — the 8 steps

The project frames nZEB delivery as an 8-step decision framework, published as a public methodology on the project website:

1. **Define energy and cost goals** — set consumption and life-cycle cost targets up-front as the foundation of the project.
2. **Define actions and track them throughout the life cycle** — build a shared, interdisciplinary understanding with transparent processes and KPIs tracked end-to-end. Enables risk reduction, faster construction, cost control.
3. **Create win-win situations for stakeholders** — design business models so planners, developers, contractors, users and the environment benefit simultaneously.
4. **Select optimal technical solution sets** — cost-efficient technology bundles and renewables, based on industrialised, multifunctional components.
5. **Conduct life cycle cost analysis** — LCC across design, construction, operation, maintenance and end-of-life; balance capex vs. opex.
6. **Quantify co-benefits** — health, productivity, rental value, reduced employee turnover.
7. **Learn from frontrunners** — study nZEB projects already realised cost-efficiently, avoid known pitfalls.
8. **Integrate into business cases** — weave technologies and business models into a single planning / construction / operation framework.

---

## 4. The CRAVEzero Pinboard (online platform)

The **Pinboard** is CRAVEzero's interactive web platform, a "framework organising all information and tools needed to build an effective low-LCC nZEB business model". It bundles nine web tools:

1. **Case Study Dashboard** — interactive exploration of frontrunner buildings (see §5 and §6)
2. **nZEB Revenue Stream** — financial modelling support
3. **Business Model Canvas** — strategic planning resource
4. **nZEB Process Map** — interactive life-cycle workflow (see §8)
5. **LCC Database (beta)** — life-cycle cost repository
6. **Life Cycle Project Management** — project tracking
7. **Help / Videos** — educational resources (tutorials on YouTube)
8. **Life Cycle Cost Calculator** — interactive online LCC tool
9. **nZEB Life Cycle Tracker Tool** — downloadable Excel tracker

Primary URL: <https://www.cravezero.eu/pboard/PinboardMain/PinboardMain/>

> *Note for our project:* CRAVEzero's LCC Excel workbook (`200512_LCC_tool_beta_v2.xlsm`) is the direct predecessor of the web application we are building. Our app replaces this spreadsheet with a modern Next.js tool while preserving the CRAVEzero methodology.

---

## 5. Life Cycle Cost Tool (the tool our app replaces)

**What it is:** a comprehensive Excel workbook to perform LCC analysis for nZEBs, freely downloadable.

**Standards and normative references**
- **ISO 15686-5:2017** — *Service-life planning — Part 5: Life-cycle costing*. Structures the whole LCC framework of the tool.
- **EN 15459:2018** — provides yearly maintenance-cost percentages for HVAC systems relative to initial construction cost.
- **European Code of Measurement** (European Committee of Construction Economists) — used to structure construction-cost data.

**Workbook structure (6 sheets)**
- *Input sheets:* Project Information (3 parts), WLC, Construction Cost, Calc Maintenance
- *Output sheets:* Results, Charts

**Required inputs (high level)**
- **Project Information – Part I:** building surfaces and volumes, energy calculation data (treated floor area, U-values, PV capacity), construction-cost verification
- **Project Information – Part II:** interest rates, fuel prices, annual price-increase rates, energy consumption and production (kWh/m²)
- **WLC sheet:** land cost, enabling costs, planning fees, design costs (preliminary / definitive / executive), site management
- **Construction Cost sheet:** detailed breakdown by building element (material, labour, unit or aggregated costs)

**Outputs**
- Summarised results for building elements, services, whole-life costs, and separate construction / operational phases
- Graphical representations (pie, stacked bar, breakdown charts)

**Scope limitation**
- End-of-life costs (ISO 15686-5 process 6) **not yet implemented** in the beta tool.

**Official download & tutorial**
- Excel beta: <https://www.cravezero.eu/pinboard/Downloads/CRAVEzero_LCC_tool_beta.zip>
- 11-minute YouTube tutorial by EURAC Research

---

## 6. Interactive Case Study Dashboard

**Purpose:** a multi-objective building life-cycle cost and performance analysis tool.
**Content:** real data from demonstration projects fed into models, producing **roughly half a million variants** that users can search and filter online.
**Indicators:** life-cycle costs and CO₂ emissions across building variations; KPIs defined in deliverable D2.4.
**Features:** simultaneous filters (e.g. heating system, cost range), cross-highlighting between charts, hover for detailed variant data, CSV export of filtered results, full-screen view, print/screenshot.

The dashboard is built on the six/seven "frontrunner" case studies profiled in §7.

---

## 7. Case studies — the "frontrunner" buildings

13 demonstration cases analysed in deliverable D2.2 (11 residential + 2 office), across **Austria, France, Germany, Italy and Sweden**. The ones with public fact sheets on the CRAVEzero site:

### 7.1 Solallén — Växjö, Sweden (2015)

- **Type:** residential (tenant-owned, *Brf Solallén*); **Net ZEB**
- **Owner / design:** Brf Solallén / Skanska Teknik
- **Gross heated floor area:** 11,500 m²
- **Envelope & systems:** high-performance insulation, air-tight construction, balanced ventilation with heat recovery, ground-source heat pump, **120 kWp PV**
- **Energy:** primary 23.3 kWh/m²·y • final 9 kWh/m²·y • heating 3.9 • DHW 8.9 • aux elec 11.4 • cooling 0
- **RES:** 115 MWh/y PV → 100% coverage of primary energy
- **LCC (40 y):** total **€2,185/m²** — investment €1,474 / operation €711 / maintenance €436

### 7.2 Aspern IQ — Vienna, Austria (2012)

- **Type:** office flagship in Aspern Lakeside urban development; **Plus Energy**
- **Owner / design:** City of Vienna / ATP Wien
- **Gross heated floor area:** 10,620 m²
- **Systems:** electrical heat pump on server waste heat, ground-water heat pump, PV, **10 kW small wind turbine**
- **Energy:** primary 66.8 kWh/m²·y • final 51.8 • heating ≈8 • cooling ≈10 • DHW 5.4
- **CO₂:** 11,775 kgCO₂/y
- **LCC (40 y):** total **€1,681/m²** — investment €1,160 / operation €521 / maintenance €416

### 7.3 Residence Alizari — Malaunay, France (2015)

- **Type:** residential, certified **PassivHaus** and ZEB (heating/cooling/ventilation/lighting/DHW)
- **Owner / design:** HABITAT 76 / Atelier des Deux Anges
- **GFA:** 2,190 m² heated / 5,085 m² total
- **Systems:** triple-glazed envelope with internal + external insulation, double-flux ventilation with heat recovery, centralised wood boiler, PV
- **Energy:** primary 98 kWh/m²·y • final 91.8 • heating 37,743 kWh/y • cooling 5,420 kWh/y • DHW 94,842 kWh/y
- **RES:** 29,201 kWh/y
- **CO₂:** 61,088 kgCO₂/y
- **LCC (40 y):** total **€6,299,009** (€2,230/m²) — investment €4,082,683 / maintenance €1,699,010 (42%) / energy €517,317 (~1%)

### 7.4 MORE — Lodi, Italy (2014)

- **Type:** compact modular single-family home (central core, precast components)
- **Owner / design:** Groppi-Tacchinardi / Valentina Moretti
- **GFA:** 175 m²
- **Systems:** heat pump integrated with condensing boiler, solar thermal, MVHR (VMC)
- **Energy:** primary 37.79 kWh/m²·y (design) / 22.44 (APE) • final 117 • heating 32 • cooling 18.5 • DHW 9.7 • class A
- **RES:** 3.51 kW solar thermal → 2,888 kWh/y (56.1% of primary need)
- **LCC (40 y):** total **€830,026 (€4,716/m²)** — investment €2,624/m² / maintenance €1,412/m² / energy €680/m²
- **Cost split:** materials €1,781/m² • labour €690/m² • services €482/m²

### 7.5 Isola Nel Verde — Milan, Italy (2012)

- **Type:** residential development, class A
- **Owner / design:** Isola Nel Verde S.R.L. / Studio Associato Eureka!
- **GFA:** 1,134 m²
- **Systems:** cogeneration, geothermal heat pump, PV, solar thermal, green roof
- **Energy:** primary heating 21.19 kWh/m²·y (design) / 20.93 (APE) • heating 42,312 kWh/y • cooling 10,608 • DHW 33,151
- **RES:** 9.36 kWp PV → 10,228 kWh/y (200% primary) • 26 kW solar thermal → 11,962 kWh/y (18.5%)
- **LCC (40 y):** total **€3,615/m²** — investment €1,899/m² / operation €1,716/m² / energy €610/m²
- **Building cost shares:** HVAC 15% • windows 2%

### 7.6 Green Home Nanterre — Nanterre, France (2016)

- **Type:** plus-energy residential
- **Design:** Atelier Zündel Cristea
- **GFA:** 11,500 m² heated / 9,267 m² net
- **Systems:** triple glazing, decentralised ventilation with 96% heat recovery, grey-water heat recovery, **120 kWp PV**
- **Energy:** primary 93 kWh/m²·y • final 9 • heating 3.9 • cooling 0 • DHW 8.9
- **RES:** 115 MWh/y → 100% coverage
- **LCC (40 y):** total **€11,580,243 (€1,069/m²)** — investment €10,189,126 / maintenance €665/m² / energy cost offset **−€537/m²** (energy exported > consumed)
- **VMC:** 9% of construction costs

### 7.7 NH-Tirol — Innsbruck, Austria (2008–2009)

- **Type:** large residential complex
- **Owner / design:** Neue Heimat Tirol / Architekturwerkstatt din a4
- **GFA:** 7,493.2 m² (PHPP)
- **Systems:** wood cogeneration + solar thermal (DHW) + MVHR
- **Energy:** primary 26 kWh/m²·y (heating + DHW + aux) • heating 11 • DHW 29.4 • electricity 32.0
- **CO₂:** 1,254,362 kgCO₂/y
- **LCC (40 y):** total **€94,354,111 (€1,795/m²)** — investment €48,022,514 / annual energy 343 €/m² / RES share of final energy 0%

### 7.8 Väla Gård — Helsingborg, Sweden (2012)

- **Type:** Net ZEB office / mixed-use
- **Owner / design:** Skanska Sverige AB / Tengbom
- **GFA:** 1,670 m²
- **Systems:** balanced ventilation with heat recovery, ground-source heat pump, PV, high insulation + air-tightness
- **Energy:** primary 98 kWh/m²·y • final 39 • **67.5 kWp PV** → 41 kWh/m²·y
- **CO₂:** 3,750 kgCO₂/y
- **LCC (40 y):** total **€4,588,972 (€2,931/m²)** — investment €2,940,069 / energy €576,689 / maintenance €916,519 / RES share of LCC 3%

### 7.9 i+R Headquarter — Lauterach, Austria (2011–2013)

- **Type:** office headquarters, 20 km SE of Lindau/Bodensee
- **Owner / design:** I.+R. Schertler Alge GmbH / Dietrich Untertrifaller Architekten
- **GFA:** 3,629 m²
- **Systems:** reversible geothermal heat pump, PV (48,059 kWh/y)
- **Energy:** final 97.78 kWh/m²·y • heating 28 • cooling 1.54 • DHW 3.77 • electricity 66.01
- **CO₂:** 23.1 kgCO₂/y
- **LCC (40 y):** total **€14.76 M** — investment €7.26 M (construction €6.15 M) / energy €3.93 M / maintenance €3.57 M

### 7.10–7.13 Other cases listed on the website
- **i+R Headquarter** (see 7.9)
- **NH-Tirol** (see 7.7)
- **Brussels** building (Eggenstein-Leopoldshafen area) — gas condensing heater + solar thermal
- Additional cases used only inside the parametric models and dashboard

---

## 8. Key findings from the case-study LCC analysis (D2.2)

- **Investment share:** design + materials + labour ≈ **60% of total LCC**
- **Operation share:** energy + maintenance ≈ **40% of total LCC**
- **Energy alone:** ≈ **15% of total LCC** (strongly reduced by on-site RES)
- In plus-energy cases (e.g. Green Home Nanterre) the energy component is **negative** over the life cycle because exported energy > consumed.
- nZEB-specific technologies are a **modest share** of construction cost compared with structural elements — confirming that cost-effective nZEBs are possible without blowing the budget.
- Results are normalised for local context (climate, use, prices) to enable cross-case comparison.

---

## 9. Process map — life-cycle phases

CRAVEzero organises the life cycle in **five phases** (with an additional "end of life" addressed conceptually but not fully costed in the tool beta):

1. **Urban Planning** — political / spatial strategy; demand planning; renewable potential assessment
2. **Integrated Building Design** — concept → authorisation → technical design, with iterative interdisciplinary teams and MacLeamy-curve front-loading
3. **Construction** — lean construction, prefabrication, off-site manufacturing, QC, supplier coordination
4. **Operation** — user-behaviour optimisation, preventive/predictive maintenance, performance monitoring vs. targets
5. **End of Life** — decommissioning, material recovery

**Typical actors and time horizons**
- Owners / investors — full life cycle (25–50 y)
- Tenants / users — operation only
- Architects & planners — design → completion
- Contractors & suppliers — construction
- Property managers — operation
- Energy providers — infrastructure integration

**Common pitfalls flagged by the project**
- Urban planning: weak demand planning, missing RES site assessment, goals misaligned with nZEB targets
- Design: weak integral planning, poor communication, lack of nZEB expertise

**Process tools produced**
- *Interactive Life Cycle Process Map* (web)
- *Life Cycle Tracker Tool* (Excel) — project roles, actions, responsibility matrix
- *Process Tracker* — downloadable KPI-monitoring resource

---

## 10. Deliverables library (public reports)

All deliverables are PDF downloads from <https://www.cravezero.eu/reports/>.

| # | Title |
|---|---|
| D1.2 | Quality and Risk Plan |
| D1.4 | 1st Progress Report |
| **D2.1** | **EU Implementation of nZEBs** |
| **D2.2** | **nZEB Life Cycle Costs — Spreadsheet with LCCs** (case-study analysis) |
| **D2.3** | **Structured Repository of existing LCC calculation tools** |
| **D2.4** | **Key Performance Indicators for nZEBs** |
| **D3.1** | **Guideline I — nZEB Processes** |
| D3.2 | Optimized nZEB Process Map |
| **D4.1** | **Guideline II — nZEB Technologies** |
| D4.2 | Optimized Solution Sets |
| D4.3 | Energy Flexible Building Managing Models |
| D5.1 | Typology Canvas — Business Models |
| D5.2 | Existing nZEB Business Models |
| D5.3 | Database of all found services and BMs |
| D5.4 | Guideline III — nZEB Business Models |
| D6.1 | Parametric nZEB Models |
| D6.2 | Results of Parametric Models |
| **D6.3** | **Parametric Models — nZEB Life Cycle Costs** (final) |
| D6.4 | Co-Benefits of nZEBs |
| **D7.1** | **CRAVEzero Pinboard Manual** |
| D7.2 / D7.3 | Prototypical Implementation Part I & II |
| D8.1 / D8.4 | Dissemination and Communication Plan |
| D9.1 | H-Requirement No.1 |

Bolded rows are the most relevant for the LCC-calculator landing page (LCC methodology, tool repository, KPIs, parametric LCC results, pinboard manual).

---

## 11. Landing-page content blocks (ready-to-adapt)

These are copy-paste-ready paragraphs written from the reference above. Adjust tone and length for the final design.

### 11.1 Hero sub-headline
> This tool is the successor of the CRAVEzero Life Cycle Cost workbook — an H2020 research output that benchmarked nearly zero-energy buildings across Europe. We've rebuilt it for the web, preserving the ISO 15686-5 methodology and extending it with modern UX, collaboration and up-to-date data.

### 11.2 "What is CRAVEzero?" block
> CRAVEzero (*Cost Reduction and market Acceleration for Viable nearly zero-Energy buildings*) was a Horizon 2020 research project (2017–2020, grant agreement 741223) that tackled the single biggest objection to nZEBs: they cost too much. Across nine partners from five countries, coordinated by AEE INTEC, the project dissected 13 frontrunner buildings and produced open tools — a life-cycle cost spreadsheet, an interactive case-study dashboard, a business-model canvas and a process map — so planners can hit EPBD targets without blowing the budget.

### 11.3 "Why this calculator exists" block
> The CRAVEzero Excel LCC tool has been downloaded thousands of times and is still the de-facto reference for ISO 15686-5 compliant life-cycle costing in the nZEB space. It is, however, a spreadsheet — hard to collaborate on, hard to audit, and limited to the modelling capacity of Excel. This web application preserves its methodology (ISO 15686-5, EN 15459, European Code of Measurement) while adding structured data entry, sensitivity analysis, variant comparison and an end-of-life module that the beta workbook never shipped.

### 11.4 Methodology block
Use the **8 steps** from §3 as a numbered list or timeline component. Each step is a one-line hook readers can scan in 10 seconds.

### 11.5 Case-study teaser cards
Use §7. Good candidates for hero cards: **Solallén (SE)**, **Aspern IQ (AT)**, **Alizari (FR)**, **MORE (IT)** — covers 4 countries and mixes residential / office / single-family / flagship.

### 11.6 Reference / credibility strip
Logos and names:
- AEE INTEC (coordinator)
- EURAC Research
- Fraunhofer ISE
- Bouygues Construction
- Skanska
- ATP sustain
- Moretti
- Köhler & Meinzer
- 3i

Tagline: *Built on an EU Horizon 2020 consortium of 9 partners across 5 countries.*

---

## 12. Source URLs

### CRAVEzero official
- Project home: <https://www.cravezero.eu/>
- About: <https://cravezero.eu/about/>
- Methodology: <https://cravezero.eu/2020/04/30/cravezero-methodology/>
- Processes: <https://www.cravezero.eu/processes/>
- EU implementation of nZEBs: <https://cravezero.eu/euimplementationofnzebs/>
- Reports index: <https://www.cravezero.eu/reports/>
- News: <https://www.cravezero.eu/news/>
- Case index: <https://cravezero.eu/category/cases/>
- Pinboard main: <https://www.cravezero.eu/pboard/PinboardMain/PinboardMain/>
- LCC tool page: <http://www.cravezero.eu/pinboard/Downloads/LCCTool.html>
- LCC tool download: <https://www.cravezero.eu/pinboard/Downloads/CRAVEzero_LCC_tool_beta.zip>
- Dashboard info: <http://www.cravezero.eu/pinboard/Dashboard/DBInfo.html>
- D2.2 LCC benchmarks: <https://www.cravezero.eu/2018/09/20/d2-2-spreadsheet-with-lccs-case-studies-analysis/>
- D2.2 PDF: <https://www.cravezero.eu/wp-content/uploads/2018/09/CRAVEzero_D22_Spreadsheet-with-LCCs.pdf>
- D7.2 PDF: <https://www.cravezero.eu/wp-content/uploads/2020/05/CRAVEzero_D72_Prototypical%20Implementation.pdf>

### Case-study fact sheets
- Solallén: <https://cravezero.eu/2017/10/18/solallen/>
- Aspern IQ: <https://cravezero.eu/2017/10/18/aspern-iq/>
- Residence Alizari: <https://cravezero.eu/2018/02/20/alizari/>
- MORE: <https://cravezero.eu/2017/10/18/more/>
- Isola Nel Verde: <https://cravezero.eu/2017/10/18/isola-nel-verde/>
- Green Home Nanterre: <https://cravezero.eu/2017/09/10/green-home-nanterre/>
- NH-Tirol: <https://cravezero.eu/2017/10/18/nh-tirol/>
- Väla Gård: <https://cravezero.eu/2017/10/18/vala-gard/>
- i+R Headquarter: <https://cravezero.eu/2017/10/18/ir-headquarter/>

### External references
- Eurac Research — CRAVEzero: <https://www.eurac.edu/en/institutes-centers/institute-for-renewable-energy/projects/cravezero>
- Fraunhofer ISE — CRAVEzero: <https://www.ise.fraunhofer.de/en/research-projects/cravezero.html>
- EUREC — *The next generation of cost-effective nZEBs*: <https://eurec.be/the-next-generation-of-cost-effective-nzebs/>
- nZEB Ready platform — CRAVEzero pinboard output page: <https://platform.nzebready.eu/initiative-output/cravezero-pinboard/>

---

## 13. Notes for implementation

- Several CRAVEzero pages return **HTTP 429** on first scrape and 301-redirect from HTTPS `.htm` to HTTP `.html` — include graceful fallback if the landing page links out to Pinboard pages.
- The cravezero.eu site also serves many **spam / injected links** at the top of some pages (the WordPress install looks compromised). Do **not** embed their nav as-is in our landing page. Use the curated URLs above.
- For logos, fetch from each partner's own domain (AEE INTEC, Eurac, Fraunhofer ISE, Skanska, Bouygues, ATP sustain, Moretti, Köhler & Meinzer).
- D7.2 (Prototypical Implementation) and D7.1 (Pinboard Manual) are the most useful deliverables for replicating look-and-feel choices from the original tool.

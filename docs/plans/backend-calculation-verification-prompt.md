# LCC Backend Calculation Verification Prompt

> Copia tutto il contenuto sotto la linea e incollalo in un altro LLM (ChatGPT, Gemini, Perplexity, ecc.) insieme ai file indicati nella sezione "Resources". Il prompt è auto-sufficiente e non richiede contesto esterno.

---

# ROLE

You are a senior quantity surveyor and financial engineer with deep expertise in:
- **ISO 15686-5** (service life planning / Life Cycle Costing)
- **EN 15459** (economic evaluation of building energy systems)
- **Discounted cash-flow analysis**, NPV, payback period, residual value
- **Spreadsheet auditing** — you can trace formula references across sheets, spot broken `$` anchors, detect off-by-one errors, and identify hardcoded cells that should be parameters.

Your job is to **independently verify that the TypeScript calculation engine described below correctly implements the formulas of an Excel LCC workbook** that it replaces. Assume nothing. Treat this as a forensic audit, not a code review.

---

# CONTEXT

An Italian research group (EURAC / Free University of Bolzano) is replacing a legacy Excel LCC tool (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`, ~2020) with a Next.js + PostgreSQL web application. The TypeScript backend ("engine") must produce numerically **identical** results to the Excel workbook when run in `excel_replica` mode, and produce **corrected** results (respecting the original intent) in `excel_bugfixed` mode.

The domain: whole-life-cost of buildings over a 20–100 year reference period, combining construction, energy, maintenance, residual value, and income projections.

**You are verifying the engine against the Excel, not the other way around.** If they disagree, the Excel is the reference for `excel_replica`; the *documented intent* is the reference for `excel_bugfixed`.

---

# RESOURCES YOU WILL EXAMINE

Attach / open these files before starting:

1. **Excel workbook (ground truth):**
   - `CRAVEzero/200512_LCC_tool_beta_v2.xlsm`
   - Sheets of interest: `PI` (Project Information), `Calc`, `Maintenance`, `Construction cost`, `Results`, `WLC`
   - Also helpful: 4 real-case workbooks (VälaGård, Héliades, Aspern, Solallen) for sanity inputs

2. **Engine source code (subject under test):**
   - `src/engine/index.ts` — top-level orchestrator
   - `src/engine/discount.ts` — FIN-001, FIN-002
   - `src/engine/energy.ts` — NRG-001..007
   - `src/engine/maintenance.ts` — MNT-001..004
   - `src/engine/aggregate.ts` — AGG-001..014, CAL-001..008
   - `src/engine/residual.ts` — RES-001
   - `src/engine/income.ts` — INC-001..003
   - `src/engine/validation.ts` — input ranges
   - `src/engine/constants.ts` — EN 15459 + energy source tables
   - `src/engine/types.ts` — enums, category→maintenance-type map, end-use pairs

3. **Data-layer glue (pre-aggregates DB rows before handing them to the engine):**
   - `src/server/trpc/routers/_shared.ts` — `buildVariantInput`, `resolveDetailCost` (MAX rule), Decimal→number
   - `src/server/trpc/routers/calculation.ts` — entry point that loads a variant and calls `calculateLCC`
   - `src/server/trpc/routers/cost-item.ts` — cost-detail aggregation

4. **Documentation (the engine authors' own claims — verify don't trust):**
   - `docs/formula-map.md` — Excel-cell → code-formula mapping
   - `docs/architecture-decisions.md` — DEC-001..010 design decisions

5. **Extracted Excel data dumps (JSON):**
   - `scripts/output/en15459.json` — component lifespan + maintenance %
   - `scripts/output/energy_sources.json` — 18 fuel sources with prices/escalation
   - `scripts/output/formulas_raw.json` — raw formulas extracted from every cell

---

# METHODOLOGY

For each formula ID below, perform these steps **in order** and show your work:

## Step 1 — Locate in Excel
Open the Excel workbook. Find the cell(s) listed in "Excel reference". Copy the exact formula verbatim. Identify every cell reference and resolve it: what sheet, what row/column, what value/meaning.

## Step 2 — Locate in code
Open the TypeScript file at the given `file.ts:line`. Copy the exact code verbatim.

## Step 3 — Translate both to math
Write the Excel formula in algebraic / sigma-notation. Write the TypeScript code in the same notation.

## Step 4 — Compare
Are they identical? If not, is the difference:
- (a) a documented intentional deviation (`excel_bugfixed` mode, METHOD_IMPROVEMENT, DEC-xxx decision)?
- (b) a bug in the engine (deviates from Excel without justification)?
- (c) a bug in the Excel that the engine correctly replicates (`excel_replica` mode)?
- (d) an arithmetic equivalence (different form, same result — prove it)?

## Step 5 — Test numerically
Pick at least **two** plausible input sets (one small, one extreme edge). Evaluate both the Excel and the engine by hand. Record residuals.

- Edge cases you **must** test when the formula supports them:
  - `referencePeriod = 1` and `referencePeriod = 100`
  - `interestRate = inflationRate` (makes RR = 0)
  - `interestRate < inflationRate` (makes RR negative)
  - `treatedFloorArea = 0`
  - Energy source index = 1 (maps to header row in Excel — what does Excel return?)
  - EN 15459 lifespan where `referencePeriod % lifespan == 0` exactly
  - EN 15459 lifespan > referencePeriod (no replacement ever)
  - Secondary dual-system is `null` (heating_2 missing)

## Step 6 — Verdict
One of: **PASS**, **PASS (intentional deviation: <DEC-xxx / mode>)**, **FAIL (engine bug)**, **INCONCLUSIVE (need <specific info>)**.

## Step 7 — Repeat for all formulas
Do not skip. Do not batch. The findings should be a table where every formula ID has its own row.

---

# FORMULAS TO VERIFY

Below are the 30+ formulas the engine claims to implement. For each, I give: **formula ID, human name, the engine's claimed math, the engine's claimed Excel reference, the file:line to inspect, non-obvious behavior the authors warn about**.

Do not trust the "claimed math" — rederive it from the source. The claimed Excel reference is where to start looking but Excel cell addresses may have shifted (columns for Variant 0/1/2 are offset).

---

## FIN — Financial primitives

### FIN-001 · Real interest rate (simplified Fisher)
- **Claimed math:** `RR = (Rint − Ri) / (1 + Ri)`
- **Excel:** `PI!D125 = (D121 − D123) / (1 + (D123/100))`
- **Code:** `src/engine/discount.ts:8-13`, function `computeRealInterestRate`
- **Watch for:** Excel divides Ri by 100 inside the denominator — is this because Excel stores Ri as a percentage (e.g. 56 meaning 0.56%), or as basis-points? Confirm the engine receives Ri as a **decimal** (0.0056), and that this matches the web form's normalization. Verify sign of RR when Rint < Ri.

### FIN-002 · Discount factor series
- **Claimed math:** `df[0] = 1`, `df[y] = 1 / (1 + RR)^y`
- **Excel:** `Calc!D8 = (1 / (1 + PI!$D$125))^D7` where `D7` is year number
- **Code:** `src/engine/discount.ts:20-30`
- **Watch for:** Array length must be `referencePeriod + 1`. Year 0 discount factor must be exactly 1.0 (construction undiscounted). Confirm that actual downstream callers **use** these factors consistently vs. recomputing `Math.pow(1+RR, y)` inline.

---

## NRG — Energy costs

### NRG-001 · Energy price escalation
- **Claimed math:** `price[y] = price[y−1] × (1 + g)` — geometric, per energy source
- **Excel:** `Calc!E9 = D9 + (INDEX('PI'!$G$131:$G$149, index) × D9)` — arithmetic equivalent
- **Code:** `src/engine/energy.ts:24-35`, function `escalatePrice`
- **Watch for:**
  - Which **index** is passed in? Excel uses the per-end-use source index from `PI` rows 156–171. Make sure heating/cooling/DHW each get their *own* source's growth rate.
  - **KNOWN EXCEL BUG NRG-BUG-001:** `Calc!E24` (household electricity, Base variant) uses `PI!$D$166` (DHW-1 source index) instead of `PI!$D$169` (household source index). The engine does **not** replicate this bug. Confirm.
  - **KNOWN EXCEL BUG NRG-BUG-002:** Variant 2 initial energy cost lookup uses `$L$` (V1 price column) instead of `$R$` (V2). Engine bypasses because it receives pre-aggregated prices. Confirm.

### NRG-002 / NRG-003 · Annual nominal & actualized energy costs
- **Claimed math:**
  - `nominal[y] = consumption_kWh_per_m² × treatedFloorArea × price[y]`
  - `actualized[y] = nominal[y] / (1 + RR)^y`
- **Excel:**
  - `Calc!D11 = (D9 × PI!$G$160) + (D10 × PI!$G$161)` (sum of 2 systems for heating)
  - `Calc!D12 = D11 × D8` (D8 = discount factor from FIN-002)
- **Code:** `src/engine/energy.ts:38-62` (`computeEndUseCosts`), `:64-75` (dual-system summation)
- **Watch for:**
  - **DEC-005 asymmetry:** Energy uses **RR (real)**, maintenance uses **Rint (nominal)**. Verify engine uses `realRate` for energy discounting.
  - Dual systems: if `secondary` is null, only primary is summed. No artifact.
  - Year 0 must be 0 for all arrays (nominal, actualized, cumulated).

### NRG-004 · Cumulated energy cost
- **Claimed math:** `cum[y] = cum[y−1] + actualized[y]`, `cum[0] = 0`
- **Excel:** Year 1: `=E12`; later years: `=C13+D12` (running sum)
- **Code:** same loop in `computeEndUseCosts`
- **Watch for:** Heating year-1 formula (`=E12`) is different from Cooling year-1 (`=D18+E17`) but both give the same result because year 0 = 0. Engine uses consistent running-sum — confirm the running-sum yields identical values year by year.

### NRG-005 · Household electricity (single system)
- **Claimed math:** same as NRG-002 with single system, specific consumption × area
- **Excel:** `Calc!D26 = D24 × PI!$G$169`
- **Code:** `src/engine/energy.ts:141-163`
- **Watch for:** NRG-BUG-001 applies here. Confirm engine reads household source index correctly, independent of DHW.

### NRG-006 / NRG-007 · PV production & cost offset
- **Claimed math:** `pv_value[y] = pv_kWh × price_PV[y]` — uses **hardcoded source index 13** ("Electricity from Photovoltaics")
- **Excel:** `Calc!D30 = D28 × PI!$G$171`; `Calc!E28 = D28 + (INDEX('PI'!$G$131:$G$149, 13) × D28)`
- **Code:** `src/engine/energy.ts:165-192`, constant `PV_SOURCE_INDEX = 13` at `:21`
- **Watch for:**
  - Input can be either total `pvProductionKwh` OR `specificConsumption` (kWh/m²). If total kWh, engine divides by area to normalize, then re-multiplies — verify the round-trip cancels correctly.
  - PV is **subtracted** from energy cost in the aggregate step (see AGG-008), not here.
  - Verify index 13 in `scripts/output/energy_sources.json` actually is PV, not something else.

---

## MNT — Maintenance

### MNT-001 / MNT-002 · Building element maintenance (A1–A10)
- **Claimed math:**
  - `annual[y] = (material + labor + other for A-categories) × maint_pct`
  - `discounted[y] = annual[y] / (1 + Rint)^y`
  - `cum[y] = cum[y−1] + discounted[y]`
- **Excel:**
  - `Maintenance!G7 = construction_cost × PI!D175`
  - `Maintenance!I7 = $G$7 / ((1+$D$5)^I5)`, where `$D$5 = Rint` and `I5 = year number`
- **Code:** `src/engine/maintenance.ts:32-51`
- **Watch for:**
  - **Nominal rate (Rint), not real rate (RR).** This is intentional (DEC-005). Verify.
  - Single `buildingElementMaintenancePercent` applied to *all* A-categories combined (not per category). Verify construction sum only includes A1–A10 (filter on `CATEGORY_MAINTENANCE_MAP` type = `'building_element'`).
  - Confirm D, E (furnishings, outdoor) excluded.

### MNT-003 / MNT-004 · Building service maintenance & replacement (B1–B6, C1–C3)
- **Claimed math:** For each service component with lifespan `L`, maintenance rate `m`, construction cost `C`:
  - Non-replacement year: `cost[y] = C × m / (1 + Rint)^y`
  - Replacement year (`y mod L == 0`, capped at 3 cycles): `cost[y] = C / (1 + Rint)^y`
- **Excel:**
  - Lookup: `Maintenance!F37 = INDEX(Calc!$E$404:$E$483, D37)` (maint %), `H37 = INDEX(Calc!$H$404:$H$483, D37)` (lifespan)
  - Detection: `IF(OR(I5=$H$37, I5=$H$37*2, I5=$H$37*3), …)` — **explicit check of 1×, 2×, 3× only, not modulo**
  - Replacement: `$E$37 / ((1+$D$5)^I5)` — uses construction cost, nominal rate
  - Annual maint: `$G$37 / ((1+$D$5)^I5)`
- **Code:** `src/engine/maintenance.ts:53-98`
- **Watch for:**
  - **DEC-003 replacement cap:** Excel hard-codes three replacement cycles. Engine uses `y % L == 0` with a counter capped at 3. These agree for `referencePeriod ≤ 3L`. For longer periods they diverge — engine stops at 3 replacements while Excel would also stop (no 4× formula). Confirm behavioral equivalence.
  - **KNOWN EXCEL BUG MNT-BUG-001:** `Maintenance!I62` (last service component row, index 26) has `^(I)` instead of `^(I5)` in the replacement branch. `I` evaluates to **column index 9** (the letter "I" = 9th column), not the year. So replacement cost on that row is always discounted by `(1+Rint)^9`, regardless of year.
    - Engine replicates this in `excel_replica` mode (sets `exponent = 9` for the LAST service component in the input array).
    - Engine corrects it in `excel_bugfixed` mode.
    - **VERIFY: Is "last element of `serviceComponents` array" equivalent to "Excel row 62"?** If users can reorder components in the web UI, the replica mode may apply the bug to the wrong component.
  - Missing EN 15459 component → lifespan = 0, no replacement, 0% maint. Confirm.

---

## CAL / AGG — Aggregation

### CAL-001 / CAL-002 · Cumulated energy at reference period
- **Claimed math:**
  - `energy_consumed = heating.cum[N] + cooling.cum[N] + dhw.cum[N] + household.cum[N]`
  - `energy_produced = pv.cum[N]`
- **Excel:** `Results!B77 = INDEX(Calc!C91:AQ91, PI!D119 + 1)` — the **+1** is because the Calc range starts at column C = year 0
- **Code:** `src/engine/aggregate.ts:86-94`
- **Watch for:** Confirm `cum[referencePeriod]` with engine's 0-indexed arrays (length N+1) gives the same result as Excel's `INDEX(…, N+1)`.

### AGG-001..007 · Cost totals (materials, labor, other, by category, non-construction, design, site management)
- **Claimed math:** straightforward sums
- **Excel:** `Results!B66`, `B71`, `B65`, `B56`, `B57`, `B61`
- **Code:** `src/engine/aggregate.ts:53-84`
- **Watch for:**
  - `resolveDetailCost()` in `src/server/trpc/routers/_shared.ts:18-27` applies `MAX(materialCost, unitPrice × area)` at the tRPC layer, **before** the engine sees the data. Verify the MAX rule is applied per cost-item detail row, not across a whole category (which would be wrong).
  - Design costs (preliminary + definitive + executive) and site management are separate totals per DEC-010.

### AGG-008 · Operation & maintenance (O&M)
- **Claimed math:** `O&M = energy_consumed − energy_produced + total_maintenance`
- **Excel:** `Results!B76 = B77 − B78 + B80`
- **Code:** `src/engine/aggregate.ts:96-98`
- **Watch for:** PV is subtracted (it's a credit). Total maintenance is the final-year cumulated of `elements + services`.

### AGG-012 / AGG-013 · LCC and WLC
- **Claimed math:**
  - `LCC = design + construction + O&M + site_management`
  - `WLC = LCC + non_construction`
- **Excel:** `Results!B62 = B57 + B65 + B76 + B61`; `B55 = B62 + B56`
- **Code:** `src/engine/aggregate.ts:100-105`
- **Watch for:** Per DEC-010, LCC has **four** components (design and site management separate). Confirm this is what Excel does (site mgmt is B61, design is B57, NOT bundled).

### AGG-014 · KPIs (ratios + per-m²)
- **Claimed math:**
  - `investment_cost = construction + design + site_management`
  - `kpi_design = design / investment_cost`
  - `kpi_construction = materials / investment_cost`
  - `kpi_labor = labor / investment_cost`
  - `kpi_om = O&M / investment_cost`
  - `kpi_lcc_per_m² = LCC / treatedFloorArea`
  - `kpi_wlc_per_m² = WLC / treatedFloorArea`
- **Excel:** `Results!B82..B85` all divide by **B63 (investment cost)**, not B62 (LCC). Code variables are named `kpiDesignOverLCC` despite dividing by investment cost.
- **Code:** `src/engine/aggregate.ts:107-121`
- **Watch for:**
  - **Naming trap:** "…OverLCC" is a misnomer; divisor is investment cost. Do NOT "fix" this by switching to LCC divisor unless that's the intent. Verify which divisor Excel actually uses by inspecting `Results!B82` formula.
  - Division-by-zero: `safeRatio` returns null. Confirm.
  - Rounding: ratios to 4 decimal places, per-m² to 2dp.

---

## RES — Residual value (METHOD_IMPROVEMENT — not in Excel)

### RES-001 · ISO 15686-5 residual value
- **Claimed math:** For each building service / renewable (B1–B6, C1–C3):
  - `remaining_life = L − (N mod L)`
  - `fraction = max(0, remaining_life / L)`
  - `residual = C × fraction / (1 + RR)^N`
  - `total = Σ residual across components`
- **Excel:** NOT IMPLEMENTED. Construction cost sheet has a "RESIDUAL VALUE" column but cells are empty.
- **Code:** `src/engine/residual.ts:19-47`
- **Watch for:**
  - DEC-006: intentional deviation from Excel, implements ISO 15686-5. Verdict here should be **PASS (METHOD_IMPROVEMENT, DEC-006)** if math is correct, regardless of Excel.
  - Uses **RR (real rate)**, not Rint. Inconsistent with maintenance (which uses Rint). Is that correct?
  - Building elements (A1–A10) are NOT passed in (conceptually their lifespan = reference period → 0 residual). Confirm `src/engine/index.ts:75` filters correctly.
  - Residual is **subtracted** from LCC: `src/engine/index.ts:80` — `lccNetResidual = agg.lcc − residual.total`. Verify.

---

## INC — Income analysis (METHOD_IMPROVEMENT — not in Excel)

### INC-001 · Net annual income
- **Claimed math:** `income = Σ(monthly_per_m² × area × 12 − taxes)_rent + Σ(amount − taxes)_other`
- **Excel:** Data is collected in `PI` rows 84–113 but never computed. Per DEC-007.
- **Code:** `src/engine/income.ts:25-33`
- **Watch for:** 3 rent slots, 3 other-income slots. tRPC layer (`_shared.ts:122-159`) reshapes flat Prisma fields into arrays.

### INC-002 · Simple payback
- **Claimed math:** `years = LCC / income` (if income > 0, else null)
- **Code:** `src/engine/income.ts:36-37`
- **Watch for:** Uses LCC (not WLC, not investment cost). Ignores time value of money. Negative income → null.

### INC-003 · NPV
- **Claimed math:**
  - `npv_income = Σ(income / (1 + RR)^y)` for y = 1..N
  - `NPV = npv_income − LCC`
- **Code:** `src/engine/income.ts:40-44`
- **Watch for:** Constant income (no escalation). Year 0 excluded. Uses RR.

---

## VAL — Input validation

### Range checks in `src/engine/validation.ts:3-57`
- `referencePeriod` ∈ [1, 100]
- `interestRate` ∈ [−0.1, 0.5]  (−10% to +50%)
- `inflationRate` ∈ [−0.1, 0.5]
- `treatedFloorArea` ≥ 0
- `energySourceIndex` ∈ [1, 19]
- `en15459ComponentIndex` ∈ [1, 79]
- No negative costs
- No duplicate `endUse` entries

**Watch for:** Index 1 in the energy-sources table points to a header row in Excel (row 131 is the "Fuel Source" label, not data). Effectively means "no source selected" and returns 0 price. Verify validation allows index 1 without producing garbage downstream.

---

## CONFIG / MODE

- **Engine config default:** `formulaMode = 'excel_bugfixed'`, `maxReplacementCycles = 3`
- **Prisma enum:** `FormulaMode = EXCEL_REPLICA | EXCEL_BUGFIXED` (SCREAMING_CASE)
- **Engine type:** `'excel_replica' | 'excel_bugfixed'` (lowercase)
- **Conversion:** Done implicitly by the tRPC zod schema — `src/server/trpc/routers/calculation.ts:17-18`. No explicit mapper. Verify no case-sensitivity bug.

---

# EXPECTED DELIVERABLE

Produce a Markdown document with:

## 1. Summary table
| Formula ID | Name | Verdict | Notes |
|---|---|---|---|
| FIN-001 | Real interest rate | PASS / FAIL / INCONCLUSIVE | … |
| … | … | … | … |

## 2. Detailed findings per formula
For every row above, a subsection with:
- **Excel formula (verbatim):** …
- **Engine formula (verbatim):** …
- **Math in both:** …
- **Numerical tests:** at least 2 input sets with expected values and the delta between Excel and engine output
- **Verdict:** …
- **Reasoning:** …

## 3. Cross-cutting concerns
- Inconsistencies between `formula-map.md` claims and actual Excel / actual code
- Cases where the engine is correct but misleadingly named (e.g. `kpiDesignOverLCC` / investment cost)
- Edge-case failures not covered by `validation.ts`
- Floating-point accumulation concerns over long reference periods
- Concerns about the tRPC pre-aggregation step (MAX rule, Decimal → number precision loss)

## 4. Bug inventory
List every bug found, classified as:
- **CRITICAL** — produces wrong LCC/WLC for realistic inputs
- **MAJOR** — affects a specific subtotal but not the headline number
- **MINOR** — rounding, edge case, cosmetic
- **COSMETIC** — naming, comments, documentation drift

Each bug entry: description, reproduction (input → expected → actual), file:line, suggested fix.

## 5. Open questions
Things you could not resolve from the materials. Be specific: "I couldn't determine X because the Excel workbook's cell Y references sheet Z which I cannot open" — not vague.

---

# RULES OF ENGAGEMENT

1. **Do not trust documentation.** `formula-map.md` and `architecture-decisions.md` are the engine authors' own claims. Verify each claim against the Excel and the code independently.
2. **Quote exact cell addresses and exact code lines.** No paraphrasing.
3. **Reproduce numerically.** A formula-to-formula comparison is not enough. Plug in numbers.
4. **Distinguish intent from implementation.** A bug replicated on purpose (`excel_replica`) is not the engine's bug — but if replica mode applies the bug to the *wrong* element (e.g. last-in-array vs. row 62), that IS a bug.
5. **Excel uses some percentages as integers** (e.g., `Ri = 56` for 0.56%) and some as decimals. Check each rate separately.
6. **Column offsets for variants:** Base variant lives in Excel columns around C-I, Variant 1 around BF, Variant 2 around DC. When `formula-map.md` quotes a Base-variant cell, verify the offset math for V1/V2.
7. **Write less, check more.** A short verdict with solid evidence beats a long report that hand-waves.

Start with FIN-001 and work through in the order listed. Report after each section; do not wait until the end.

# Formula Map

**Source:** CRAVEzero workbook (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`)
**Extraction date:** 2026-03-26
**Total formulas extracted:** 23,668 cells across 7 sheets
**Formula IDs documented:** 39 (FIN: 2, NRG: 7, MNT: 4, CAL: 8, AGG: 14, RES: 1, INC: 3)

---

## Formula Reference Table

### FIN -- Financial

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| FIN-001 | Real interest rate | PI | D125 | `=(D121-D123)/(1+(D123/100))` | Rint (nominal), Ri (inflation) | RR (real rate) | EXCEL_REPLICA | Simplified Fisher equation. Rint and Ri stored as basis points in Calc (e.g., 151 = 1.51%), converted via D121=Calc!C3/10000 |
| FIN-002 | Discount factor | Calc | D8 | `=(1/(1+'Project Information'!$D$125))^D7` | RR, year | Present value factor | EXCEL_REPLICA | PV = 1/(1+RR)^year. Year 0 yields factor = 1.0 |

### NRG -- Energy

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| NRG-001 | Energy price escalation | Calc | E9 | `=D9+(INDEX('PI'!$G$131:$G$149,'PI'!$D$160)*D9)` | prev_price, annual_increase_rate | new_price | EXCEL_REPLICA | Compound growth: `price * (1 + rate)`. Applied per-year starting year 1. Initial price from PI energy table |
| NRG-002 | Annual nominal energy cost | Calc | D11 | `=(D9*'PI'!$G$160)+(D10*'PI'!$G$161)` | price x consumption (2 systems) | nominal_cost | EXCEL_REPLICA | Heating/Cooling/DHW each have 2 systems summed. Household has 1 system (NRG-005) |
| NRG-003 | Actualized energy cost | Calc | D12 | `=D11*D8` | nominal_cost x discount_factor | actualized_cost | EXCEL_REPLICA | Discounted by RR (real rate), not Rint |
| NRG-004 | Cumulated energy cost | Calc | D13 | Year 1: `=D12` / Year N: `=C13+D12` | running sum of actualized | cumulated_cost | EXCEL_REPLICA | Running sum. See Open Question 1 for Cooling year 1 inconsistency |
| NRG-005 | Household electricity cost | Calc | D26 | `=D24*'PI'!$G$169` | price x consumption | nominal_cost | EXCEL_REPLICA | Single system only (no system 2). Uses dedicated household row in PI |
| NRG-006 | PV production value | Calc | D30 | `=D28*'PI'!$G$171` | PV_price x production_kWh | nominal_PV_value | EXCEL_REPLICA | Single system. Price escalation uses PI!G143 directly, not INDEX lookup |
| NRG-007 | Total consumption (kWh) | PI | G160 | `=F160*$D$52` | specific_consumption (kWh/m2) x treated_floor_area (m2) | total_kWh | EXCEL_REPLICA | Converts specific to absolute consumption |

### MNT -- Maintenance

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| MNT-001 | Building element maintenance | Maintenance | I7 | `=$G$7/((1+$D$5)^(I5))` | annual_maint_cost, Rint, year | discounted_maint | EXCEL_REPLICA | Uses Rint (nominal), NOT RR (real). See DEC-005 |
| MNT-002 | Building element annual cost | Maintenance | G7 | `=construction_cost * maintenance_%` | construction_cost, PI!D175 | annual_maint | EXCEL_REPLICA | Flat percentage of construction cost |
| MNT-003 | Service component lookup | Maintenance | F37/H37 | `=INDEX(Calc!$H$404:$H$483,D37)` / `=INDEX(Calc!$E$404:$E$483,D37)` | EN15459_index | maintenance_%, lifespan | EXCEL_REPLICA | Looks up EN 15459 table. Index from column D |
| MNT-004 | Building service maintenance | Maintenance | I37 | `=IF(OR(I5=$H$37,I5=($H$37*2),I5=($H$37*3)),($E$37/((1+$D$5)^(I5))),($G$37/((1+$D$5)^(I5))))` | year, lifespan, construction_cost, annual_maint | discounted_cost | EXCEL_REPLICA | Replacement if year = N x lifespan (N=1,2,3). Replacement uses construction cost; non-replacement uses annual maintenance cost. Both discounted by Rint |

### CAL -- Calculation Aggregation

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| CAL-001 | Energy consumed aggregation | Calc | E89 | `=E12+E17+E22+E26` | actualized heating + cooling + DHW + household | total_energy_consumed | EXCEL_REPLICA | Per-year sum of 4 energy categories (actualized) |
| CAL-002 | Energy produced aggregation | Calc | E90 | `=E30` | actualized PV value | total_energy_produced | EXCEL_REPLICA | Currently only PV |
| CAL-003 | Cumulated energy consumed | Calc | D91 | Year 1: `=D89` / Year N: `=C91+D89` | running sum of CAL-001 | cumulated_consumed | EXCEL_REPLICA | |
| CAL-004 | Cumulated energy produced | Calc | D92 | Year 1: `=D90` / Year N: `=C92+D90` | running sum of CAL-002 | cumulated_produced | EXCEL_REPLICA | |
| CAL-005 | Maintenance total | Calc | D93 | `=D95+D97` | elements + services | total_maintenance | EXCEL_REPLICA | Sum of CAL-006 and CAL-007 |
| CAL-006 | Maintenance elements bridge | Calc | D95 | `=Maintenance!I64` | Maintenance sheet elements total | elements_total | EXCEL_REPLICA | Column shifts per year (I=year1, J=year2, ...) |
| CAL-007 | Maintenance services bridge | Calc | D97 | `=Maintenance!I65` | Maintenance sheet services total | services_total | EXCEL_REPLICA | Column shifts per year |
| CAL-008 | Cumulated maintenance | Calc | D94 | Year 1: `=D93` / Year N: `=C94+D93` | running sum of CAL-005 | cumulated_maintenance | EXCEL_REPLICA | |

### AGG -- Results Aggregation

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| AGG-001 | Construction total per category | Results | F4-F53 | `=D{row}+E{row}` | materials + labor | construction_cost_per_category | EXCEL_REPLICA | 21 cost categories (A1-A10, B1-B6, C1-C3, D1, E1) |
| AGG-002 | Total materials | Results | B66 | Sum of material columns | per-category materials | total_materials | EXCEL_REPLICA | |
| AGG-003 | Total labor | Results | B71 | Sum of labor columns | per-category labor | total_labor | EXCEL_REPLICA | |
| AGG-004 | Construction total | Results | B65 | `=B66+B71` | materials + labor | total_construction | EXCEL_REPLICA | |
| AGG-005 | Non-construction costs | Results | B56 | `=WLC!G27+WLC!J27` | land + enabling + planning + support + finance | non_construction | EXCEL_REPLICA | WLC!G27 = G12+G16+G20+G22+G23+G24+G26 |
| AGG-006 | Design costs total | Results | B57 | `=SUM(B58:B60)` | preliminary + definitive + executive design fees | total_design | EXCEL_REPLICA | From WLC rows 33-72 |
| AGG-007 | Building site management | Results | B61 | `=WLC!J84` | site management costs | total_site_mgmt | EXCEL_REPLICA | Separate from design in LCC formula (DEC-010) |
| AGG-008 | O&M costs | Results | B76 | `=B77-B78+B80` | energy_consumed - energy_produced + maintenance | total_O_and_M | EXCEL_REPLICA | |
| AGG-009 | Energy consumed at ref period | Results | B77 | `=INDEX(Calc!C91:AQ91,'PI'!D119+1)` | cumulated energy consumed at year N | energy_consumed_total | EXCEL_REPLICA | INDEX offset +1 because range starts at col C (year 0) |
| AGG-010 | Energy produced at ref period | Results | B78 | `=INDEX(Calc!C92:AQ92,'PI'!D119+1)` | cumulated PV at year N | energy_produced_total | EXCEL_REPLICA | |
| AGG-011 | Maintenance at ref period | Results | B80 | `=INDEX(Calc!C94:AQ94,'PI'!D119+1)` | cumulated maintenance at year N | maintenance_total | EXCEL_REPLICA | |
| AGG-012 | LCC | Results | B62 | `=B57+B65+B76+B61` | design + construction + O&M + site_mgmt | LCC | EXCEL_REPLICA | 4 components. Site management is NOT part of design |
| AGG-013 | WLC | Results | B55 | `=B62+B56` | LCC + non_construction | WLC | EXCEL_REPLICA | |
| AGG-014 | KPI ratios | Results | B82-B85 | `=(B58+B59+B60)/B63`, `=B66/B63`, `=B71/B63`, `=B76/B63` | component / investment_cost | ratio | EXCEL_REPLICA | **Divisor is B63 (investment cost = construction + design + site_mgmt), NOT B62 (LCC)**. See Open Question 3 |

### RES -- Residual Value

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| RES-001 | Residual value | -- | -- | Not in Excel | cost, lifespan, ref_period, RR | residual_value | METHOD_IMPROVEMENT | ISO 15686-5. Formula: `cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod`. Applied to B*/C* categories only (building services with EN 15459 lifespan). Subtracted from LCC |

### INC -- Income

| ID | Name | Sheet | Cell(s) | Formula | Inputs | Output | Classification | Notes |
|----|------|-------|---------|---------|--------|--------|----------------|-------|
| INC-001 | Net annual income | -- | -- | Not in Excel | rents, taxes, other_income | net_annual_income | METHOD_IMPROVEMENT | `sum(monthly_rent * area * 12 - taxes) + sum(other_income - taxes)`. Excel collects data in PI rows 84-113 but never calculates |
| INC-002 | Simple payback period | -- | -- | Not in Excel | LCC, annual_income | payback_years | METHOD_IMPROVEMENT | `LCC / net_annual_income` |
| INC-003 | NPV of income stream | -- | -- | Not in Excel | annual_income, RR, ref_period | NPV | METHOD_IMPROVEMENT | `sum(income / (1+RR)^year)` for year 1..refPeriod |

---

## Variant Column Mapping

### Project Information Sheet

| Field | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Reference period (years) | D119 | J119 | O119 |
| Interest rate Rint (nominal) | D121 | J121 | O121 |
| Inflation rate Ri | D123 | J123 | O123 |
| Real interest rate RR | D125 | J125 | O125 |
| Treated floor area (m2) | D52 | D52 (shared) | D52 (shared) |
| Energy price (EUR/kWh) | F131:F149 | L131:L149 | R131:R149 |
| Energy price increase (%/yr) | G131:G149 | M131:M149 | S131:S149 |
| Energy source index | D160-D169 | J160-J169 | O160-O169 |
| Specific consumption (kWh/m2) | F160-F169 | L160-L169 | Q160-Q169 |
| Total consumption (kWh) | G160-G169 | M160-M169 | R160-R169 |
| Energy cost lookup | E160-E169 | K160-K169 | P160-P169 |

### Calc Sheet (Row Blocks)

| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Year row | 7 | 34 | 61 |
| Discount factor | 8 | 35 | 62 |
| Heating (5 rows: price1, price2, nominal, actualized, cumulated) | 9-13 | 36-40 | 63-67 |
| Cooling (5 rows) | 14-18 | 41-45 | 68-72 |
| DHW (5 rows) | 19-23 | 46-50 | 73-77 |
| Household electricity (4 rows: price, nominal, actualized, cumulated) | 24-27 | 51-54 | 78-81 |
| PV production (4 rows: price, nominal, actualized, cumulated) | 28-31 | 55-58 | 82-85 |
| Aggregation: energy consumed/produced/cumulated, maintenance | 88-98 | 100-111 | 113-124 |

### Maintenance Sheet (Column Blocks)

| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Config columns (category, cost, maint%, etc.) | A-H | A-H (shared) | A-H (shared) |
| Year columns start | I (col 9, year 1) | BF (col 58, year 1) | DC (col 107, year 1) |
| Building elements rows | 7-36 (30 elements, row 36 = total elements, row 64 = sum) | Same rows | Same rows |
| Building services rows | 37-63 (27 services, row 63 = total services, row 65 = sum) | Same rows | Same rows |

### Results Sheet (Column Blocks)

| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Category label | A | H | O |
| Values (EUR) | B | I | P |
| Units | C | J | Q |
| Per-m2 values | D | K | R |

---

## Known Bugs

### MNT-BUG-001: Maintenance row 62 exponent missing year reference

- **Cell:** `Maintenance!I62` (and all year columns for row 62)
- **Formula:** `=IF(OR(I5=$H$62,...),($E$62/((1+$D$5)^(I))),($G$62/((1+$D$5)^(I5))))`
- **Bug:** In the TRUE branch (replacement year), the exponent is `^(I)` instead of `^(I5)`. The column letter `I` is interpreted as a column reference (value = column number 9), not as the year value from row 5.
- **Impact:** Replacement costs for the last building service component (row 62, index 26) are discounted using a fixed value instead of the actual year number. The FALSE branch (maintenance year) correctly uses `^(I5)`.
- **Affected scope:** Only row 62 (the 26th/last building service component). All other service rows (37-61) correctly reference `^(I5)`.
- **Engine handling:** `excel_replica` mode replicates this bug; `excel_bugfixed` mode uses the correct `^(year)`.

### NRG-BUG-001: Household electricity uses DHW energy source for escalation

- **Cells:** `Calc!E24` (Base), `Calc!E51` (V1), `Calc!E78` (V2)
- **Formula (Base):** `=D24+(INDEX('Project Information'!$G$131:$G$149,'Project Information'!$D$166)*D24)`
- **Bug:** Uses `PI!$D$166` (DHW system 1 energy source index) instead of `PI!$D$169` (Household electricity source index) for looking up the annual price increase rate.
- **Impact:** Household electricity prices escalate at DHW's energy source annual increase rate. If both DHW and Household use the same energy source (common case), this bug is invisible.
- **Affected scope:** All 3 variants identically (same absolute reference `$D$166`).
- **Note:** The initial price lookup `PI!$E$169` correctly references the Household row. Only the escalation INDEX is wrong.

### NRG-BUG-002: Variant 2 energy cost uses Variant 1 price table

- **Cells:** `PI!P160:P169` (V2 energy cost lookup formula)
- **Formula:** `=INDEX($L$131:$L$149,O160)` -- uses `$L$` (V1 price column) instead of `$R$` (V2 price column)
- **Impact:** Variant 2 initial energy costs are calculated using Variant 1's energy prices, not its own price table.
- **Scope:** Affects only the initial price lookup. The annual escalation rate correctly uses V2's own increase rate column.

### MNT-BUG-002: Variant 2 maintenance services references Variant 1 data

- **Cell:** `Calc!D123` (and subsequent year columns in the V2 aggregation block)
- **Formula:** `=Maintenance!BF65` -- BF is Variant 1's column block; should be DC (Variant 2)
- **Impact:** Variant 2's building services maintenance totals are actually Variant 1's values.

### Results!F77: Broken #REF! reference

- **Formula:** `=LOOKUP('Project Information'!D119,Calc!#REF!)`
- **Impact:** Cell contains a `#REF!` error from a deleted column range. **Not used in any LCC/WLC calculation.** Documented for completeness only.

---

## Open Questions

### 1. Cumulated formula inconsistency: Heating vs Cooling year 1

- **What we know:** Heating cumulated (Calc row 13) at year 1 uses `=E12` (just year 1 actualized value). Cooling cumulated (Calc row 18) at year 1 uses `=D18+E17` (year 0 + year 1 actualized). DHW (row 23) uses `=E22` like Heating.
- **Practical impact:** Since year 0 actualized values are 0 (no operational costs at construction), both formulas produce the same result.
- **Recommendation:** Engine uses consistent logic: `cumulated[year] = cumulated[year-1] + actualized[year]`, with `cumulated[0] = 0`.

### 2. Energy source index = 1 maps to header row

- **What we know:** Default energy source index is 1, which maps to PI row 131 (the "Fuel Source" header). `INDEX($F$131:$F$149, 1)` returns the header cell's value (no price data), yielding a price of 0.
- **Practical impact:** Selecting index 1 effectively means "no source selected" with zero cost.
- **Recommendation:** Web app form validation requires indices 2-19 (valid sources). Engine treats index 1 as zero-price sentinel.

### 3. KPI divisor: B63 (Investment cost) vs B62 (LCC)

- **What we know:** Results KPI formulas (B82-B85) divide by B63 (Investment cost = construction + design + site_mgmt), NOT by B62 (LCC which also includes O&M).
- **Formula evidence:** `B63 = B65 + B57 + B61` (construction + design + site_mgmt). `B62 = B57 + B65 + B76 + B61` (design + construction + O&M + site_mgmt).
- **Discrepancy:** The implementation plan says "AGG-014: component / LCC" but the actual Excel formula divides by investment cost.
- **Recommendation:** Engine replicates Excel behavior (divide by investment cost B63). Document the distinction between Investment Cost and LCC clearly in the UI.

---

## Cross-Reference Notes

All formula cell references in this document have been verified against `scripts/output/formulas_raw.json` (23,668 extracted formula cells). The formula text matches the actual workbook content as read by openpyxl with `data_only=False`.

**Source documents:**
- `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` -- Excel workbook (source of truth)
- `scripts/output/formulas_raw.json` -- Programmatic formula extraction
- `scripts/output/en15459.json` -- EN 15459 component table
- `scripts/output/energy_sources.json` -- Energy source list
- `llc-implementation-plan.md` -- Implementation plan v4
- `.planning/phases/02-excel-workbook-audit/02-RESEARCH.md` -- Phase 2 research findings

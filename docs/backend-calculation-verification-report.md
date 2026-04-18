# LCC Backend Calculation Verification Report

## Scope

This audit compares the TypeScript engine to the workbook `CRAVEzero/200512_LCC_tool_beta_v2.xlsm`.

- Workbook formulas were checked directly from the `.xlsm` with `openpyxl` and against `scripts/output/formulas_raw.json`.
- Engine and tRPC glue were checked from source.
- Numerical probes were run against the current engine with small synthetic inputs and the repo fixture input.
- The existing Vitest suite passes, but its golden data is self-generated from the current engine, not from the Excel workbook.

## Summary Table

| Formula ID | Name | Verdict | Notes |
|---|---|---|---|
| FIN-001 | Real interest rate | FAIL (engine bug) | Excel uses `1 + (Ri/100)` with `Ri` already stored as decimal; engine uses `1 + Ri`. |
| FIN-002 | Discount factor series | PASS with caveat | Formula is correct in isolation, but end-to-end discounting inherits the wrong `RR` from FIN-001; the computed array is also unused downstream. |
| NRG-001 | Energy price escalation | PASS with caveat | Per-source geometric escalation matches Excel algebraically. Replica mode does not reproduce household/V2 Excel bugs. |
| NRG-002 | Annual nominal energy costs | PASS with caveat | Effective year-1..N logic matches workbook's used series, but end-to-end results inherit FIN-001. |
| NRG-003 | Actualized energy costs | FAIL (inherits FIN-001) | Discounting formula is fine, but the `RR` feeding it is not Excel-identical. |
| NRG-004 | Cumulated energy costs | PASS with caveat | Running-sum logic matches the used Calc/Results chain. End-to-end values inherit FIN-001. |
| NRG-005 | Household electricity | FAIL (excel_replica mismatch) | Engine always uses the correct household source index; Excel replica bug `Calc!E24` is not reproduced. |
| NRG-006 | PV production value | FAIL (engine bug) | `treatedFloorArea = 0` with `pvProductionKwh > 0` yields `NaN`; workbook formula does not depend on area. |
| NRG-007 | PV cost offset / fixed PV source | PASS with caveat | Fixed source index 13 matches workbook. End-to-end values still inherit FIN-001. |
| MNT-001 | Building element maintenance annual | FAIL (engine bug) | Engine maintenance base includes `otherCost` and all A categories; workbook uses `Results!F*` material+labor rows only and omits some A subgroups. |
| MNT-002 | Building element maintenance cumulated | FAIL (engine bug) | Same base-cost mismatch as MNT-001. |
| MNT-003 | Service maintenance annual | PASS with caveat | Lookup/replacement split matches workbook for ordinary rows. Replica mode bug targeting is unstable. |
| MNT-004 | Service replacement | FAIL (excel_replica mismatch) | Replica bug is applied to the last array element, not to a stable workbook-equivalent row. |
| CAL-001 | Cumulated energy consumed at ref period | PASS with caveat | `cumulated[N]` matches `INDEX(Calc!C91:AQ91, N+1)`. Input series still inherit FIN-001. |
| CAL-002 | Cumulated energy produced at ref period | PASS with caveat | Same as CAL-001; PV area-zero bug can still poison the result. |
| AGG-001 | Per-category construction totals | FAIL (engine bug) | Workbook category construction totals are material+labor; engine adds `otherCost`. |
| AGG-002 | Total materials | PASS | Straight sum of material costs. |
| AGG-003 | Total labor | PASS | Straight sum of labor costs. |
| AGG-004 | Total construction | FAIL (engine bug) | Workbook `Results!B65 = B66 + B71`; engine adds `otherCost`. |
| AGG-005 | Non-construction costs | FAIL (engine bug) | `buildVariantInput()` maps `landCost = landPrice`; workbook computes land total from land area and unit price. |
| AGG-006 | Design costs | PASS | Sum of preliminary + definitive + executive. |
| AGG-007 | Site management | PASS | Separate total, consistent with workbook. |
| AGG-008 | Operation & maintenance | FAIL (inherits upstream bugs) | Formula is correct, but energy and maintenance inputs are not workbook-identical. |
| AGG-012 | LCC | FAIL (inherits upstream bugs) | Construction, O&M, and sometimes non-construction inputs diverge. |
| AGG-013 | WLC | FAIL (inherits upstream bugs) | Same as AGG-012 plus AGG-005. |
| AGG-014 | KPIs | FAIL (engine bug) | Denominator choice matches workbook, but investment cost includes `otherCost`; divide-by-zero handling is also a deliberate deviation from Excel errors. |
| RES-001 | Residual value | PASS (METHOD_IMPROVEMENT, DEC-006) | Math matches the stated ISO-style formula. Actual values still inherit FIN-001 because `RR` is wrong. |
| INC-001 | Net annual income | PASS | Matches stated method improvement. |
| INC-002 | Simple payback | PASS | `LCC / income` when income is positive. |
| INC-003 | NPV | PASS with caveat | Formula matches the stated method improvement; actual values inherit FIN-001. |
| VAL | Input validation | PASS with caveat | Ranges are implemented; index 1 is tolerated and resolves to zero cost via missing-source handling. |
| CONFIG | Mode/default/config | FAIL (partial replica support) | Default mode is correct, but replica behavior is incomplete for NRG and unstable for MNT. |

## Detailed Findings

### FIN

#### FIN-001

- Excel formula: `Project Information!D125 = (D121-D123)/(1+(D123/100))`
- Upstream cells:
  - `Project Information!D121 = Calc!C3/10000`, cached `0.0151`
  - `Project Information!D123 = Calc!C4/10000`, cached `0.0056`
- Engine code: `src/engine/discount.ts:8-13`
  - `return (nominalRate - inflationRate) / (1 + inflationRate);`
- Math:
  - Excel: `RR_excel = (Rint - Ri) / (1 + Ri/100)`
  - Engine: `RR_engine = (Rint - Ri) / (1 + Ri)`
- Numerical tests:
  - Case A: `Rint=0.0151`, `Ri=0.0056`
    - Excel: `0.009499468029790332`
    - Engine: `0.009447096260938745`
    - Delta: `-0.000052371768851587`
  - Case B: `Rint=0.01`, `Ri=0.03`
    - Excel: `-0.01999400179946016`
    - Engine: `-0.019417475728155338`
    - Delta: `0.0005765260713048222`
- Verdict: FAIL (engine bug)
- Reasoning: the web app stores rates as decimals; `PercentInput` explicitly converts `1.51% -> 0.0151`. The workbook still divides `Ri` by 100 inside the denominator. The engine does not.

#### FIN-002

- Excel formula: `Calc!D8 = (1/(1+('Project Information'!$D$125)))^D7`
- Engine code: `src/engine/discount.ts:20-30`
  - `factors[0] = 1.0;`
  - `factors[year] = 1 / Math.pow(1 + realRate, year);`
- Math: identical if `RR` is the same.
- Numerical tests:
  - Case A: `RR=0`, `N=3` -> Excel/engine both `[1, 1, 1, 1]`
  - Case B: `RR=-0.01999400179946016`, `y=1` -> Excel/engine both `1.020401918...`
- Verdict: PASS with caveat
- Reasoning: the series formula is fine. The effective engine series still differs from Excel because `RR` is already wrong at FIN-001. Also `calculateLCC()` computes the array and discards it; energy and maintenance recompute discounting inline.

### NRG

#### NRG-001

- Excel formula: `Calc!E9 = D9+(INDEX('Project Information'!$G$131:$G$149,'Project Information'!$D$160)*D9)`
- Engine code: `src/engine/energy.ts:24-35`
  - `prices[year] = prices[year - 1] * (1 + annualIncrease);`
- Math:
  - Excel: `p_y = p_(y-1) + g * p_(y-1)`
  - Engine: `p_y = p_(y-1) * (1 + g)`
- Numerical tests:
  - Case A: `p0=0.2`, `g=0.1` -> year1 `0.22`, year2 `0.242`
  - Case B: index `1` -> workbook header row / engine missing-source path both collapse to zero usable price
- Verdict: PASS with caveat
- Reasoning: the escalation itself is equivalent. Replica mode does not reproduce workbook bug `Calc!E24` for household electricity, and V2 initial-price bug `Project Information!P160 = INDEX($L$131:$L$149,O160)` is bypassed by the app's pre-aggregated energy-price JSON.

#### NRG-002 / NRG-003 / NRG-004

- Workbook formulas:
  - `Calc!D11 = (D9*'Project Information'!$G$160)+(D10*'Project Information'!$G$161)`
  - `Calc!D12 = D11*D8`
  - `Calc!E13 = E12`, `Calc!F13 = E13+F12`
  - Bridge used by results: `Calc!D89 = Calc!E12+Calc!E17+Calc!E22+Calc!E26`, `Calc!D91 = D89`
- Engine code: `src/engine/energy.ts:38-75`
  - `nominal[year] = totalConsumption * prices[year];`
  - `actualized[year] = nominal[year] / Math.pow(1 + realRate, year);`
  - `cumulated[year] = cumulated[year - 1] + actualized[year];`
- Math:
  - Engine year `1..N` matches the workbook's used series, because the workbook bridges from `E12/E17/E22/E26` onward and skips the dead year-0 staging cells in column `D`.
- Numerical tests:
  - Case A: `area=100`, system1 `10 kWh/m2`, source3 `0.2` with `g=10%`, system2 `5 kWh/m2`, source2 `0.1` with `g=5%`, `RR=0.02`
    - Nominal year1: `272.5`
    - Actualized year1: `267.15686274509807`
    - Cumulated year3: `858.1331369533589`
    - Engine probe matched these values.
  - Case B: `secondary = null`
    - Engine sums only the primary system and does not create artifacts.
- Verdict:
  - NRG-002: PASS with caveat
  - NRG-003: FAIL (inherits FIN-001)
  - NRG-004: PASS with caveat
- Reasoning: the annual-cost and running-sum logic are sound, but the real rate used for discounting is not Excel-identical because FIN-001 is wrong.

#### NRG-005

- Excel formula:
  - Initial price: `Calc!D24 = 'Project Information'!$E$169`
  - Escalation bug: `Calc!E24 = D24+(INDEX('Project Information'!$G$131:$G$149,'Project Information'!$D$166))*D24`
- Engine code:
  - household goes through the same `computeSingleSystemCosts()` path as any other single system
  - `findEnergySource(energyPrices, endUseInput.energySourceIndex)`
- Numerical test:
  - With household source index `12` and DHW source index `3`, workbook replica should escalate household with DHW growth; engine uses household growth.
- Verdict: FAIL (excel_replica mismatch)
- Reasoning: the engine always applies the corrected source mapping. That is good for bugfixed mode and wrong for replica mode.

#### NRG-006 / NRG-007

- Workbook formulas:
  - `Calc!D29 = D28*'Project Information'!$G$171`
  - `Calc!E28 = D28+'Project Information'!$G$143*D28`
  - `Calc!D30 = D29*D8`
- Engine code: `src/engine/energy.ts:165-192`
  - fixed source index `13`
  - `pvConsumption = pvInput.pvProductionKwh ? pvInput.pvProductionKwh / treatedFloorArea : pvInput.specificConsumption`
- Numerical tests:
  - Case A: `pvProductionKwh=600`, `area=100`, source13 `0.12`, `g=1%`, `RR=0.02`
    - Engine nominal year1: `72.72`
    - Cumulated year3: `211.7923196960445`
    - This matches `600 * 0.1212 / 1.02 + ...`
  - Case B: `treatedFloorArea=0`, `pvProductionKwh=14000`
    - Workbook formula still depends only on `G171` total kWh.
    - Engine returns `NaN` for `pvProduction.nominal[1]`, `energyProduced`, and `lcc`.
- Verdict:
  - NRG-006: FAIL (engine bug)
  - NRG-007: PASS with caveat
- Reasoning: source index 13 is correct, but the normalization shortcut breaks the explicit-total-kWh path at zero area.

### MNT

#### MNT-001 / MNT-002

- Workbook formulas:
  - `Maintenance!G7 = E7*F7`
  - `Maintenance!I7 = $G$7/((1+$D$5)^(I5))`
  - `Maintenance!E7 = Results!F4`, `Results!F4 = D4+E4`
- Engine code: `src/engine/maintenance.ts:33-50`
  - `sum + ci.materialCost + ci.laborCost + ci.otherCost`
  - discount by `interestRate`
- Numerical tests:
  - Case A: one A-category item with `material=100`, `labor=50`, `other=25`, maintenance `10%`, `Rint=3%`
    - Workbook-equivalent base: `150`
    - Workbook year1: `150 * 0.1 / 1.03 = 14.5631067961`
    - Engine year1: `175 * 0.1 / 1.03 = 16.9902912621`
    - Delta: `2.4271844660`
  - Case B: workbook maintenance rows omit `A2` facade rows entirely; the engine's coarse `A2_FACADES` category is still included.
- Verdict:
  - MNT-001: FAIL (engine bug)
  - MNT-002: FAIL (engine bug)
- Reasoning: workbook maintenance is based on `Results!F*`, which is material+labor only, not `otherCost`; the workbook row set is also narrower than "all A categories".

#### MNT-003 / MNT-004

- Workbook formulas:
  - `Maintenance!F37 = INDEX(Calc!$H$404:$H$483,Maintenance!D37)`
  - `Maintenance!H37 = INDEX(Calc!$E$404:$E$483,Maintenance!D37)`
  - `Maintenance!I37 = IF(OR(I5=$H$37,I5=($H$37*2),I5=($H$37*3)),($E$37/((1+$D$5)^(I5))),($G$37/((1+$D$5)^(I5))))`
  - Broken row: `Maintenance!I62 = ... ($E$62/((1+$D$5)^(I))) ...`
- Engine code: `src/engine/maintenance.ts:58-98`
  - replacement rule: `year % lifespan === 0 && replacementsUsed < maxReplacementCycles`
  - replica bug targeting: `scIdx === input.serviceComponents.length - 1`
- Numerical tests:
  - Case A: `L=15`, `C=1000`, `m=4%`, `Rint=3%`, plus a second `L=30`, `C=2000`, `m=1%`
    - Engine year15 service cost: `654.6991863446517`
    - Engine year30 service cost: `1235.960278547719`
    - These match the expected replacement/non-replacement split.
  - Case B: same two components, same costs, same replica mode, same input set but reversed array order
    - Order `A,B`: total service maintenance `4905.638256151973`
    - Order `B,A`: total service maintenance `4744.842257712013`
    - Delta: `160.79599843996`
- Verdict:
  - MNT-003: PASS with caveat
  - MNT-004: FAIL (excel_replica mismatch)
- Reasoning: the normal lookup and capped-replacement logic are fine. Replica mode is not workbook-stable because it applies the row-62 bug to whichever component happens to be last in the array returned by Prisma.

### CAL / AGG

#### CAL-001 / CAL-002

- Workbook formulas:
  - `Results!B77 = INDEX(Calc!C91:AQ91,('Project Information'!D119)+1)`
  - `Results!B78 = INDEX(Calc!C92:AQ92,('Project Information'!D119)+1)`
- Engine code: `src/engine/aggregate.ts:86-94`
  - `energy.heating.cumulated[referencePeriod] + ...`
  - `energy.pv.cumulated[referencePeriod]`
- Numerical test:
  - For a 0-indexed array of length `N+1`, `cumulated[N]` is the same element Excel gets from `INDEX(rangeStartingAtYear0, N+1)`.
- Verdict:
  - CAL-001: PASS with caveat
  - CAL-002: PASS with caveat
- Reasoning: indexing is correct. The underlying energy series can still be wrong because of FIN-001 and the PV zero-area case.

#### AGG-001 / AGG-002 / AGG-003 / AGG-004

- Workbook formulas:
  - `Results!F4 = D4+E4`
  - `Results!B66 = SUM(B67:B70)`
  - `Results!B71 = SUM(B72:B75)`
  - `Results!B65 = B66+B71`
- Engine code: `src/engine/aggregate.ts:53-68`
  - `totalConstruction = totalMaterials + totalLabor + totalOther`
  - `constructionByCategory[ci.category] = existing + ci.materialCost + ci.laborCost + ci.otherCost`
- Numerical test:
  - `material=100`, `labor=50`, `other=25`
    - Workbook category construction: `150`
    - Engine category construction: `175`
    - Workbook total construction: `150`
    - Engine total construction: `175`
- Verdict:
  - AGG-001: FAIL (engine bug)
  - AGG-002: PASS
  - AGG-003: PASS
  - AGG-004: FAIL (engine bug)
- Reasoning: Excel has only material and labor in the Results aggregation. The web app's extra `otherCost` dimension is not mapped to an Excel-equivalent subtotal.

#### AGG-005 / AGG-006 / AGG-007

- Workbook formulas:
  - `WLC!G12 = G5*G11`
  - `WLC!G27 = G12+G16+G20+G22+G23+G24+G26`
  - `Results!B56 = WLC!G27+WLC!J27`
  - `Results!B57 = SUM(B58:B60)`
  - `Results!B61 = WLC!J84`
- tRPC glue: `src/server/trpc/routers/_shared.ts:109-118`
  - `landCost: wlc ? d(wlc.landPrice) : 0`
  - `enablingCosts: enablingCost1 + enablingCost2`
  - `planningFees: planningFees1 + planningFees2`
- Numerical test:
  - `landArea=100`, `landPrice=200`, others zero
    - Workbook land subtotal: `100 * 200 = 20000`
    - `buildVariantInput()` landCost: `200`
    - Delta: `19800`
- Verdict:
  - AGG-005: FAIL (engine bug)
  - AGG-006: PASS
  - AGG-007: PASS
- Reasoning: design and site-management totals are fine. Land cost is not.

#### AGG-008 / AGG-012 / AGG-013 / AGG-014

- Workbook formulas:
  - `Results!B76 = B77-B78+B80`
  - `Results!B62 = B57+B65+B76+B61`
  - `Results!B55 = B62+B56`
  - `Results!B82 = (B58+B59+B60)/B63`
  - `Results!B83 = B66/B63`
  - `Results!B84 = B71/B63`
  - `Results!B85 = B76/B63`
- Engine code: `src/engine/aggregate.ts:96-121`
  - formula shapes match
  - denominator is correctly `investmentCost = totalConstruction + designCosts + buildingSiteManagement`
- Numerical tests:
  - With `material=100`, `labor=50`, `other=25`, zero O&M and design/site:
    - Workbook investment cost: `150`
    - Engine investment cost: `175`
    - Workbook `kpiConstruction = 100/150 = 0.666666...`
    - Engine `kpiConstruction = 100/175 = 0.571428...`
  - With `treatedFloorArea = 0`:
    - Workbook per-m2 cells would divide by zero.
    - Engine returns `null` via `safeRatio()`.
- Verdict:
  - AGG-008: FAIL (inherits upstream bugs)
  - AGG-012: FAIL (inherits upstream bugs)
  - AGG-013: FAIL (inherits upstream bugs)
  - AGG-014: FAIL (engine bug)
- Reasoning: denominator choice is workbook-correct, variable naming is not. The KPI values still diverge whenever `otherCost` is non-zero, and zero-area handling is a deliberate deviation from Excel's error semantics.

### RES

#### RES-001

- Excel implementation: none
- Engine code: `src/engine/residual.ts:19-47`
- Math:
  - `remainingLife = L - (N mod L)`
  - `fraction = max(0, remainingLife / L)`
  - `residual = C * fraction / (1 + RR)^N`
- Numerical tests:
  - Case A: `L=15`, `N=40`, `C=18000`, engine probe with current RR -> `4119.1606161230775`
  - Case B: `N mod L == 0` -> residual fraction becomes `1.0`, i.e. full post-replacement residual
- Verdict: PASS (METHOD_IMPROVEMENT, DEC-006)
- Reasoning: the implementation matches the documented method improvement. The only caveat is that `RR` currently comes from failing FIN-001.

### INC

#### INC-001 / INC-002 / INC-003

- Engine code: `src/engine/income.ts:16-51`
- Math:
  - `income = sum(monthlyPerM2 * area * 12 - taxes) + sum(amount - taxes)`
  - `payback = LCC / income` if `income > 0`
  - `NPV = sum(income / (1 + RR)^y) - LCC`
- Numerical tests:
  - Case A: one rent slot `8 * 1200 * 12 - 2400 = 112800`, one other-income slot `6000 - 800 = 5200`, total `118000`
  - Case B: negative or zero income -> engine returns `null` payback
- Verdict:
  - INC-001: PASS
  - INC-002: PASS
  - INC-003: PASS with caveat
- Reasoning: formulas match the claimed method improvement. NPV inherits the FIN-001 discount-rate issue.

### VAL

#### Validation

- Engine code: `src/engine/validation.ts:3-57`
- Checked rules:
  - `referencePeriod` in `[1, 100]`
  - `interestRate`, `inflationRate` in `[-0.1, 0.5]`
  - `treatedFloorArea >= 0`
  - `energySourceIndex` in `[1, 19]`
  - `en15459ComponentIndex` in `[1, 79]`
  - no negative costs
  - no duplicate `endUse`
- Verdict: PASS with caveat
- Reasoning: implementation matches the stated range checks. Index `1` is safe because `reference.energySources` omits the header row and `computeEnergyCosts()` falls back to zero when the source is missing.

### CONFIG / MODE

#### Mode handling

- Default config: `src/engine/types.ts:11-13` -> `formulaMode: 'excel_bugfixed'`, `maxReplacementCycles: 3`
- Calculation API input: `src/server/trpc/routers/calculation.ts:14-19` -> lowercase enum only
- Snapshot/export mapping: `src/server/export/snapshot.ts:60-64` -> explicit lowercase-to-Prisma mapper
- Verdict: FAIL (partial replica support)
- Reasoning:
  - Default and API-side lowercase handling are fine.
  - The prompt's claim that conversion is only "implicit" is incomplete; export code has an explicit mapper.
  - Replica mode is not complete:
    - household escalation bug is not reproduced
    - V2 price-table bug is not reproduced
    - maintenance row-62 bug is tied to array order, not workbook identity

## Cross-Cutting Concerns

- `docs/formula-map.md` is not a reliable ground truth. Several entries are simplified or shifted:
  - FIN-001 claims a standard simplified Fisher formula, but the workbook does not use it.
  - NRG-006/007 cell references are off by one row in the PV block (`D29/D30`, not `D30` for nominal value).
  - AGG-004 says construction is `materials + labor`; the engine uses `materials + labor + other`.
- The workbook sheet name is `Project Information`, not `PI`.
- The engine test suite is self-referential. `tests/fixtures/excel-reference.json` hard-codes the current engine's `RR = 0.009447096260938745`, not the workbook's cached `0.009499468029790332`.
- `computeDiscountFactors()` is effectively dead code from a parity standpoint. The engine computes the array and then discounts energy/residual/income inline.
- `kpiDesignOverLCC`, `kpiConstructionOverLCC`, `kpiLaborOverLCC`, and `kpiOMOverLCC` are misnamed. They divide by investment cost, not by LCC.
- `buildVariantInput()` introduces material changes before the engine ever runs:
  - `resolveDetailCost()` applies `MAX(materialCost, unitPrice * area)` per detail row.
  - Decimal -> number conversion happens at the boundary.
  - `landArea`, `buildingIndex`, and `floorHeight` are collected but ignored in the land-cost mapping.
- The UI hides some states that validation still allows:
  - energy source index `1` is valid in the engine, but `reference.energySources` omits it from the selector
  - the energy form exposes only one source selector for dual-system rows, so `HEATING_2`, `COOLING_2`, and `DHW_2` cannot be assigned a separate source from the UI even though the backend model supports it

## Bug Inventory

### CRITICAL

- FIN-001 real-interest-rate mismatch
  - Description: workbook uses `1 + Ri/100`; engine uses `1 + Ri`.
  - Reproduction: `Rint=0.0151`, `Ri=0.0056` -> Excel `0.0094994680`, engine `0.0094470963`.
  - Files: `src/engine/discount.ts:8-13`, workbook `Project Information!D125`.
  - Suggested fix: in replica mode compute `RR = (Rint - Ri) / (1 + Ri / 100)`. Keep the current form only if explicitly documented as a bugfixed method change.

- Land-cost mapping ignores workbook formula
  - Description: app maps `landCost = landPrice` instead of computing the workbook's land subtotal from the land inputs.
  - Reproduction: `landArea=100`, `landPrice=200` -> workbook land subtotal `20000`, engine input `200`.
  - Files: `src/server/trpc/routers/_shared.ts:109-118`, workbook `WLC!G12`, `WLC!G27`.
  - Suggested fix: either compute the land subtotal in `buildVariantInput()` or rename the UI field and model to make it explicit that `landPrice` is already the total land cost.

- `otherCost` leaks into workbook-replica construction, maintenance, KPI, LCC, and WLC totals
  - Description: workbook Results aggregation uses material + labor only; engine adds `otherCost`.
  - Reproduction: `material=100`, `labor=50`, `other=25` -> workbook construction `150`, engine `175`.
  - Files: `src/engine/aggregate.ts:53-68`, `src/engine/maintenance.ts:33-38`, workbook `Results!F4:F53`, `Results!B65`.
  - Suggested fix: define replica-mode mapping for `otherCost` or exclude it from workbook-replica totals.

### MAJOR

- Replica-mode maintenance bug is order-dependent
  - Description: workbook bug belongs to `Maintenance!I62`; engine applies it to the last `serviceComponents` entry.
  - Reproduction: swapping service-component array order changes replica totals without changing the component set.
  - Files: `src/engine/maintenance.ts:79-86`, `src/server/trpc/routers/calculation.ts:23-42`.
  - Suggested fix: attach replica-bug behavior to a stable workbook-equivalent identity, or disable replica mode until ordering is formalized.

- PV explicit-kWh path breaks at zero treated floor area
  - Description: `pvProductionKwh / treatedFloorArea` creates `Infinity`; multiplying back by zero yields `NaN`.
  - Reproduction: `treatedFloorArea=0`, `pvProductionKwh=14000` -> `energyProduced=NaN`, `lcc=NaN`.
  - Files: `src/engine/energy.ts:176-185`.
  - Suggested fix: if `pvProductionKwh` is already total annual production, feed it directly without area normalization.

- Replica mode does not reproduce NRG household/V2 workbook bugs
  - Description: the engine always uses corrected household-source logic and bypasses the V2 wrong-column lookup.
  - Reproduction: give household and DHW different source-growth rates; workbook replica and engine diverge.
  - Files: `src/engine/energy.ts:99-124`, workbook `Calc!E24`, `Project Information!P160`.
  - Suggested fix: either implement explicit replica-mode branches or document that replica mode is partial.

### MINOR

- `computeDiscountFactors()` is unused
  - Description: array is computed in `calculateLCC()` and discarded.
  - Files: `src/engine/index.ts:53-57`.
  - Suggested fix: either use the array or remove it from the runtime path.

- Zero-area KPI behavior intentionally diverges from Excel
  - Description: engine returns `null`; workbook would show divide-by-zero errors.
  - Files: `src/engine/aggregate.ts:41-43`, `src/engine/index.ts:144-157`.
  - Suggested fix: document the deviation explicitly.

### COSMETIC

- KPI variable names say "OverLCC" but divide by investment cost
  - Files: `src/engine/aggregate.ts:32-38`, `src/engine/aggregate.ts:107-121`.
  - Suggested fix: rename to `...OverInvestmentCost`.

- `docs/formula-map.md` and the workbook cell references drift on several rows
  - Suggested fix: regenerate the map directly from workbook extracts and separate workbook facts from implementation claims.

## Open Questions

- The workbook maintenance sheet omits facade rows (`Results!F7:F9`) and some floor subrows from the building-element maintenance block. The app only stores coarse A-category totals, so exact workbook parity may be impossible without a more granular cost schema.
- The prompt/documentation calls the RR formula "simplified Fisher", but the workbook clearly does not use the textbook decimal-rate version. I could not find any accompanying manual note that explains whether the workbook denominator is intentional or accidental.
- Variant-2 WLC formulas include some odd cross-column formulas such as `WLC!J20 = I19*I18`. I did not trace that branch fully because the current backend does not model variant-column formulas directly; only the base-case structure is mirrored in the DB schema.

# Phase 4: Calculation Engine - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 4)

<domain>
## Phase Boundary

This phase implements the pure TypeScript calculation engine in `src/engine/`. After completion, `calculateLCC(input, config)` produces a complete `LCCResult` including all cost components, time series, KPIs, residual value, and income analysis. The engine is pure (no DB, no framework, no side effects), deterministic, and testable. No tests in this phase — Phase 5 handles testing.

</domain>

<decisions>
## Implementation Decisions

### Module Order (from implementation plan TASK 4)
Implement in dependency order:
1. `discount.ts` — FIN-001, FIN-002
2. `energy.ts` — NRG-001 through NRG-007
3. `maintenance.ts` — MNT-001 through MNT-004, MNT-BUG-001, CAL-005..008
4. `residual.ts` — RES-001 (METHOD_IMPROVEMENT)
5. `income.ts` — INC-001 through INC-003 (METHOD_IMPROVEMENT)
6. `aggregate.ts` — AGG-001 through AGG-014, CAL-001..004
7. `index.ts` — orchestrator calling all modules

### Formula Specifications

**FIN-001 (Real interest rate):**
`RR = (Rint - Rinf) / (1 + Rinf)` — simplified Fisher formula.
Excel: `=(D121-D123)/(1+(D123/100))` but stored as basis points.

**FIN-002 (Discount factors):**
Array for years 0..N: `df[0] = 1.0, df[year] = 1 / (1 + RR)^year`

**NRG-001 (Energy price escalation):**
`price[year] = price[year-1] * (1 + annualIncrease)` — compound growth per source.
PV uses a fixed source index (PI!G143 directly), not the general INDEX mechanism.

**NRG-002..007 (Energy costs per end-use):**
- Heating/Cooling/DHW: 2 systems each, costs summed before discounting
- Household electricity: 1 system only
- PV production: 1 system, subtracted (not added)
- Nominal: `consumption * price[year]` (kWh/m2 * treatedFloorArea * price/kWh)
- Actualized: `nominal[year] / (1 + RR)^year` — uses RR (real rate)
- Cumulated: running sum of actualized

**MNT-001 (Building element maintenance):**
`cost[year] = totalConstruction * maintenancePercent / (1 + Rint)^year` — uses Rint (nominal rate)

**MNT-002 (Building element maintenance — cumulated):**
Running sum of yearly values

**MNT-003 (Building service maintenance — annual):**
`cost[year] = constructionCost * maintenancePercent / (1 + Rint)^year` — uses Rint
Per-component, summed across all service components

**MNT-004 (Building service replacement):**
`if (year > 0 && lifespan > 0 && year % lifespan === 0 && replacementCount < maxReplacementCycles):`
  charge full constructionCost instead of annual maintenance, also discounted by `(1+Rint)^year`

**MNT-BUG-001 (Excel bug — row 62):**
- `excel_replica` mode: use `^(I)` (column reference, wrong — always uses year from column I header)
- `excel_bugfixed` mode: use `^(I5)` (correct year reference)
- Must produce different values for the two modes

**CAL-001..004 (Energy aggregation at reference period):**
- CAL-001: totalEnergyConsumed = sum of all end-use cumulated[refPeriod] (excluding PV)
- CAL-002: totalEnergyProduced = PV cumulated[refPeriod]
- CAL-003: netEnergy = consumed - produced
- CAL-004: energyCostPerM2 = netEnergy / treatedFloorArea

**CAL-005..008 (Maintenance aggregation at reference period):**
- CAL-005: totalMaintenanceElements = elements cumulated[refPeriod]
- CAL-006: totalMaintenanceServices = services cumulated[refPeriod]
- CAL-007: totalMaintenance = elements + services at refPeriod
- CAL-008: maintenanceCostPerM2 = totalMaintenance / treatedFloorArea

**AGG-001..004 (Construction costs):**
- AGG-001: totalMaterials = sum of costItems[].materialCost
- AGG-002: totalLabor = sum of costItems[].laborCost
- AGG-003: totalConstruction = totalMaterials + totalLabor + sum(otherCost)
- AGG-004: constructionByCategory = group costItems by category, sum costs

**AGG-005..007 (Non-construction, design, site management):**
- AGG-005: nonConstructionCosts = sum(land, enabling, planning, userSupport*, finance)
- AGG-006: designCosts = wlcInput.designCostsTotal
- AGG-007: buildingSiteManagement = wlcInput.siteManagementCostsTotal (SEPARATE from design)

**AGG-008..011 (O&M):**
- AGG-008: operationAndMaintenance = energyConsumed - energyProduced + maintenanceAtRefPeriod
- AGG-009: energyConsumed = CAL-001
- AGG-010: energyProduced = CAL-002
- AGG-011: maintenanceAtRefPeriod = CAL-007

**AGG-012..013 (LCC, WLC):**
- AGG-012: LCC = designCosts + totalConstruction + operationAndMaintenance + buildingSiteManagement
- AGG-013: WLC = LCC + nonConstructionCosts

**AGG-014 (KPIs):**
- kpiDesignOverLCC = designCosts / LCC (null if LCC=0)
- kpiConstructionOverLCC = totalConstruction / LCC
- kpiLaborOverLCC = totalLabor / LCC
- kpiOMOverLCC = operationAndMaintenance / LCC
- kpiLCCPerM2 = LCC / treatedFloorArea (null if area=0)
- kpiWLCPerM2 = WLC / treatedFloorArea (null if area=0)

**RES-001 (Residual value — METHOD_IMPROVEMENT):**
Per service component: `cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod`
Applied to building services (B*, C*) only. Building elements use refPeriod as lifespan so residual=0.
Total residual subtracted from LCC: `lccNetResidual = LCC - residualValue`

**INC-001..003 (Income — METHOD_IMPROVEMENT):**
- INC-001: netAnnualIncome = sum(rent * area * 12 - taxes) + sum(otherIncome - taxes)
- INC-002: simplePaybackYears = LCC / netAnnualIncome (null if income=0)
- INC-003: npvIncomeStream = sum(netAnnualIncome / (1+RR)^year, year=1..refPeriod)
- netPresentValue = npvIncomeStream - LCC

### Implementation Rules (from plan)
1. Maintenance uses Rint (nominal rate), NOT RR. Energy uses RR. Do not normalize.
2. Building service replacement: `year % lifespan === 0 && replacementCount < maxReplacementCycles`
3. MNT-BUG-001: Two code paths based on formulaMode
4. Energy system counts: Heating/Cooling/DHW=2, Household=1, PV=1(subtracted)
5. PV is subtracted from energy consumed
6. Discount factors: year 0 = 1.0, operational costs start year 1
7. KPIs: null for zero denominators, not Infinity/NaN
8. No rounding in intermediate calculations. Round at output boundary only (2dp EUR, 4dp rates)
9. Site management is SEPARATE from design in LCC formula
10. Engine receives pre-aggregated costs (detail logic in tRPC layer)

### Claude's Discretion
- Internal helper functions within modules
- Error handling strategy (throw vs return errors)
- Whether to create additional utility types for internal use
- Code organization within each module file
- Whether to use early returns or guard clauses
- Exact rounding implementation at output boundary

</decisions>

<specifics>
## Specific Ideas

- The existing `src/engine/types.ts` defines all interfaces (VariantInput, LCCResult, etc.)
- The existing `src/engine/constants.ts` has EN 15459 data and energy sources
- The existing `src/engine/validation.ts` validates inputs before calculation
- Each module should reference formula IDs in inline comments
- The `index.ts` orchestrator calls all modules in order and assembles LCCResult
- `docs/formula-map.md` has the complete formula reference with cell references

</specifics>

<deferred>
## Deferred Ideas

- Engine tests with golden fixture (Phase 5)
- Database seed (Phase 6)
- tRPC calculate router (Phase 7)
- Any UI or API concerns

</deferred>

---
*Phase: 04-calculation-engine*
*Context gathered: 2026-03-26 via PRD Express Path*

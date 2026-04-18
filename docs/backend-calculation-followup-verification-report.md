# LCC Backend Follow-up Verification Report

Date: 2026-04-18

Scope: delta audit of the current post-fix codebase against the prior report in `docs/backend-calculation-verification-report.md`, the workbook `CRAVEzero/200512_LCC_tool_beta_v2.xlsm`, and the current test suite.

Global limitation: `git log --oneline --all --since="2026-03-26" -- src/engine src/server/trpc/routers src/components/forms tests docs` shows no post-audit commit that records these fixes. The relevant changes live only in the current dirty working tree on top of `HEAD 2757c24`. Where the prompt asked for a fix commit hash, this report records `UNCOMMITTED (working tree only)`.

## Section 1 - Policy Decisions Summary

The current working tree adopts FIN-001 outcome **(b)**: Excel is the ground truth in `excel_replica`, while `excel_bugfixed` uses the correct Fisher denominator. The evidence is the unstaged diff in `src/engine/discount.ts:10-20`, which now reads `if (formulaMode === 'excel_replica') { return (nominalRate - inflationRate) / (1 + inflationRate / 100); }` and otherwise returns `(nominalRate - inflationRate) / (1 + inflationRate)`. `src/engine/index.ts:54-63` passes `config.formulaMode` through to `computeRealInterestRate()` and then forwards the resulting `rr` into energy, residual, and income paths. Probe A with `Rint=0.0151`, `Ri=0.0056` produced `0.009499468029790332` in `excel_replica`, matching workbook cached `Project Information!D125`, and `0.009447096260938745` in `excel_bugfixed`. This is the intellectually correct policy, but it is not documented in git history or in `docs/architecture-decisions.md`.

The current working tree adopts `otherCost` policy **(i)**: `excel_replica` excludes `otherCost`, while `excel_bugfixed` includes it. The evidence is new helper logic in `src/engine/construction.ts:4-16`, where `includeOtherCost(formulaMode)` returns `formulaMode === 'excel_bugfixed'`, and the downstream callers in `src/engine/aggregate.ts:64-70` and `src/engine/maintenance.ts:33-47` now consume that mode-aware base. Probe A with `material=100`, `labor=50`, `other=25` produced `totalConstruction=150` in `excel_replica` and `175` in `excel_bugfixed`; building-element maintenance year 1 likewise shifted from `14.5631067961` to `16.9902912621`. This is defensible and consistent with the prior report, but again there is no fix commit or design-note update that records the choice.

The intended `excel_replica` completeness policy remains "replicate Excel including bugs", because `docs/architecture-decisions.md:37-47` still says exactly that. The current implementation partially aligns with that policy: household escalation bug replication is now present in `src/engine/energy.ts:188-205`, and the Variant 2 price-column bug is reproduced at the router/data-layer boundary in `src/server/trpc/routers/calculation.ts:70-96`, `src/server/trpc/routers/export.ts:104-130`, and `src/server/trpc/routers/_shared.ts:132-148`. But MNT-BUG-001 is still not tied to a stable workbook identity; it is applied to whichever service component ends up last after ordering, via `src/engine/maintenance.ts:57-94`. So the adopted policy is "full replica", but the delivered implementation is still only partially complete.

## Section 2 - Findings Re-verification Table

| Finding | Prior verdict | New verdict | Evidence |
|---|---|---|---|
| FIN-001 | FAIL | RESOLVED | UNCOMMITTED diff in `src/engine/discount.ts:10-20` and `src/engine/index.ts:54-63`; probe `0.009499468029790332` replica vs `0.009447096260938745` bugfixed; workbook `Project Information!D125 = 0.009499468029790332` |
| Land cost mapping | FAIL | PARTIALLY RESOLVED | `src/server/trpc/routers/_shared.ts:216-223` now multiplies area by price; probes `100*200 -> 20000`, `0*50000 -> 0`; UI still labels `src/components/forms/wlc-form.tsx:406` as `Land Price` without unit semantics |
| `otherCost` leak | FAIL | RESOLVED | `src/engine/construction.ts:4-16`, `src/engine/aggregate.ts:64-70`, `src/engine/maintenance.ts:33-47`; probe replica `150` vs bugfixed `175`; maintenance basis shifts accordingly |
| PV NaN at zero treated floor area | FAIL | RESOLVED | `src/engine/energy.ts:207-225`; probes `14000 kWh @ area 0 -> nominal[1]=1696.8`, zero-input path returns `0`, explicit-kWh and specific-consumption paths match at area `100` |
| MNT replica order stability | FAIL | PARTIALLY RESOLVED | `src/engine/maintenance.ts:57-94`, `src/server/trpc/routers/_shared.ts:183-193`; probe A total `3712.3149691012404`, reversed order `3482.4397812204297` |
| NRG replica bugs (household + V2) | FAIL | RESOLVED | `src/engine/energy.ts:188-205`, `src/server/trpc/routers/calculation.ts:70-96`, `src/server/trpc/routers/export.ts:104-130`, `src/server/trpc/routers/_shared.ts:132-148`; household year-1 nominal `21.0` replica vs `20.4` bugfixed; V2 replica prices become Variant 1 prices with Variant 2 growth |
| `computeDiscountFactors` dead code | MINOR | NOT ADDRESSED | `src/engine/index.ts:60` still computes and discards the array; inline `Math.pow` remains in `src/engine/energy.ts:54`, `src/engine/maintenance.ts:47,97,103`, `src/engine/residual.ts:40`, `src/engine/income.ts:42` |
| KPI renaming | COSMETIC | NOT ADDRESSED | `src/engine/aggregate.ts:36-40,114-120`, `src/engine/index.ts:149-158`, `src/components/results/results-dashboard.tsx:181-184` all still expose `kpi...OverLCC` while dividing by investment cost |
| Test fixture regeneration | CRITICAL | NOT ADDRESSED | `tests/fixtures/excel-reference.json:3-6` says values were "computed step-by-step from formula specifications"; no extraction script references the fixture; fixture still matches current engine output |
| Documentation drift | COSMETIC | NOT ADDRESSED | `docs/formula-map.md:16,23-29,36,65-67` still mixes `PI` with `Project Information` and still maps PV nominal to `D30`; `docs/architecture-decisions.md` contains no FIN-001 or `otherCost` policy update |
| Dual-system source UI gap | integration gap | RESOLVED | `src/components/forms/energy-form.tsx:205-212,269-317` now renders `Source 1` and `Source 2` selectors; backend still accepts distinct `_1` and `_2` rows |

## Section 3 - Detailed Per-finding Analysis

### 1. FIN-001 - real interest rate

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
export function computeRealInterestRate(
  nominalRate: number,
  inflationRate: number,
  formulaMode: FormulaMode = 'excel_bugfixed',
): number {
  if (formulaMode === 'excel_replica') {
    return (nominalRate - inflationRate) / (1 + inflationRate / 100);
  }

  return (nominalRate - inflationRate) / (1 + inflationRate);
}
```

```ts
const rr = computeRealInterestRate(
  input.interestRate,
  input.inflationRate,
  config.formulaMode,
);
```

Probe results:
- Prior probe A: `Rint=0.0151`, `Ri=0.0056`
- `excel_replica` -> `0.009499468029790332`
- `excel_bugfixed` -> `0.009447096260938745`
- Workbook cached value: `Project Information!D125 = 0.009499468029790332`
- New probe C: `Rint=0.05`, `Ri=0.04`
- `excel_replica` -> `0.009996001599360258`
- `excel_bugfixed` -> `0.009615384615384618`

Regression check:
- `src/engine/index.ts:63,80-93` passes the chosen `rr` into energy, residual, and income.
- Additional propagation probe on the same input showed `residualValue=850.43` replica vs `850.52` bugfixed and `npvIncomeStream=2366.23` replica vs `2366.41` bugfixed. The branch is live downstream.

Verdict:
- RESOLVED

Reasoning:
- The working tree chose outcome (b), which is the correct policy.
- The only deficiency is process: no commit or architecture note records the choice.

### 2. Land cost mapping

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
const wlcInput: WLCInputData = {
  landCost: wlc ? d(wlc.landArea) * d(wlc.landPrice) : 0,
  enablingCosts: wlc ? d(wlc.enablingCost1) + d(wlc.enablingCost2) : 0,
  planningFees: wlc ? d(wlc.planningFees1) + d(wlc.planningFees2) : 0,
```

Workbook evidence:
- `WLC!G12 = G5*G11`

Probe results:
- Prior probe: `landArea=100`, `landPrice=200`
- `buildVariantInput().wlcInput.landCost = 20000`
- `calculateLCC(...).nonConstructionCosts = 20000`
- New probe: `landArea=0`, `landPrice=50000`
- `buildVariantInput().wlcInput.landCost = 0`
- `calculateLCC(...).nonConstructionCosts = 0`

Regression check:
- No downstream caller re-overrides `landCost`; aggregate just sums `wlcInput.landCost` in `src/engine/aggregate.ts:73-80`.
- UI mismatch remains: `src/components/forms/wlc-form.tsx:403` labels `Land Area (m2)`, but `src/components/forms/wlc-form.tsx:406` labels the paired field only as `Land Price`.

Verdict:
- PARTIALLY RESOLVED

Reasoning:
- The math is fixed.
- The UI is still ambiguous about whether `landPrice` means total EUR or EUR/m2. With the new multiplication, that ambiguity is dangerous.

### 3. `otherCost` leak

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
function includeOtherCost(formulaMode: FormulaMode): boolean {
  return formulaMode === 'excel_bugfixed';
}
```

```ts
const totalConstruction = getTotalConstructionCost(costItems, formulaMode);
```

```ts
const elementConstruction = getBuildingElementConstructionBase(
  input.costItems,
  config.formulaMode,
);
```

Probe results:
- Prior probe A: `material=100`, `labor=50`, `other=25`
- `excel_replica` total construction -> `150`
- `excel_bugfixed` total construction -> `175`
- `excel_replica` maintenance year 1 -> `14.563106796116504`
- `excel_bugfixed` maintenance year 1 -> `16.990291262135923`
- New probe: KPI denominator path
- `excel_replica` `kpiConstructionOverLCC = 0.6666666666666666`
- `excel_bugfixed` `kpiConstructionOverLCC = 0.5714285714285714`

Regression check:
- `src/engine/aggregate.ts:98-123` uses the mode-correct construction total and the mode-correct maintenance total.
- `O&M = energyConsumed - energyProduced + maintenance.totalMaintenance` remains correct under the selected policy.

Verdict:
- RESOLVED

Reasoning:
- The current working tree adopted the defensible mode split: exclude in replica, include in bugfixed.
- The policy is internally consistent across construction, maintenance, KPIs, LCC, and WLC.

### 4. PV NaN at zero treated floor area

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
const pv = pvInput
  ? computeSingleSystemCosts(
      pvInput,
      energyPrices,
      treatedFloorArea,
      realRate,
      referencePeriod,
      pvInput.pvProductionKwh
        ? {
            initialPriceSourceIndex: PV_SOURCE_INDEX,
            annualIncreaseSourceIndex: PV_SOURCE_INDEX,
            totalConsumptionKwh: pvInput.pvProductionKwh,
          }
        : {
            initialPriceSourceIndex: PV_SOURCE_INDEX,
            annualIncreaseSourceIndex: PV_SOURCE_INDEX,
          },
    )
  : zeroYearlyCosts(referencePeriod);
```

Probe results:
- Prior probe A: `treatedFloorArea=0`, `pvProductionKwh=14000`, `price=0.12`, `g=0.01`, `RR=0.02`
- `nominal[1] = 1696.8`
- `actualized[1] = 1663.5294117647059`
- New probe B: `treatedFloorArea=0`, `specificConsumption=0`, `pvProductionKwh=0`
- `nominal[1] = 0`
- New probe C: `treatedFloorArea=100`, explicit `pvProductionKwh=14000` vs `specificConsumption=140`
- `nominal[1] = 1696.8` in both paths
- `cumulated[2] = 3310.749711649366` in both paths

Regression check:
- `rg` on `treatedFloorArea` shows no remaining PV-specific divide-by-area path downstream.

Verdict:
- RESOLVED

Reasoning:
- The fix uses explicit annual kWh directly instead of normalizing through area and re-multiplying.
- The zero-area poison path is gone.

### 5. MNT replica - order stability

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
const serviceComponents = [...input.serviceComponents].sort(
  (a, b) =>
    (a.replicaOrder ?? Number.MAX_SAFE_INTEGER) -
    (b.replicaOrder ?? Number.MAX_SAFE_INTEGER),
);
const replicaBuggedComponent =
  serviceComponents.length > 0
    ? serviceComponents[serviceComponents.length - 1]
    : null;
```

```ts
if (
  config.formulaMode === 'excel_replica' &&
  replicaBuggedComponent === sc
) {
  exponent = 9;
}
```

Probe results:
- Prior-style probe A: components `{L=15,m=4%,C=1000,index=1}` and `{L=30,m=1%,C=2000,index=35}`, `Rint=3%`, `N=30`, order A then B
- `totalMaintenanceServices = 3712.3149691012404`
- `services[15] = 654.6991863446517`
- `services[30] = 1944.8202242031598`
- New probe B: same inputs reversed
- `totalMaintenanceServices = 3482.4397812204297`
- `services[15] = 779.253971291561`
- `services[30] = 1590.3902513754394`

Regression check:
- The router path now sorts service components by `id` and injects `replicaOrder` in `src/server/trpc/routers/_shared.ts:183-193`, and the routers request `serviceComponents: { orderBy: { id: "asc" } }`.
- The engine API itself is still order-sensitive if callers bypass that path or deliver equal/missing IDs.

Verdict:
- PARTIALLY RESOLVED

Reasoning:
- The team stabilized one caller path.
- They did not solve the underlying identity problem. The replica bug is still "last element wins", not "workbook row 62 wins".

### 6. NRG replica bugs (household + V2)

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```ts
annualIncreaseSourceIndex:
  formulaMode === 'excel_replica'
    ? (dhwPrimaryInput?.energySourceIndex ??
      householdInput.energySourceIndex)
    : householdInput.energySourceIndex,
```

```ts
const energyPrices: EnergySourcePrice[] =
  options.formulaMode === "excel_replica" &&
  variant.label === "VARIANT_2" &&
  options.replicaVariant1EnergyPrices
    ? rawEnergyPrices.map((price) => {
        const variant1Price = options.replicaVariant1EnergyPrices?.find(
          (candidate) => candidate.index === price.index,
        );
        return variant1Price
          ? {
              ...price,
              pricePerKwh: variant1Price.pricePerKwh,
            }
          : price;
      })
    : rawEnergyPrices;
```

Workbook evidence:
- `Calc!E24 = D24+(INDEX('Project Information'!$G$131:$G$149,'Project Information'!$D$166))*D24`
- `Project Information!P160 = INDEX($L$131:$L$149,O160)`

Probe results:
- Household probe: household source `12` at 2% growth, DHW-1 source `3` at 5% growth
- `excel_replica` household nominal year 1 -> `21.0`
- `excel_bugfixed` household nominal year 1 -> `20.4`
- `excel_replica` household nominal year 2 -> `22.05`
- `excel_bugfixed` household nominal year 2 -> `20.808`
- V2 probe: Variant 2 raw prices `{0.09, 0.30}` with Variant 1 override `{0.065, 0.22}`
- resulting `energyPrices` -> `{pricePerKwh: 0.065, annualIncrease: 0.02}` and `{pricePerKwh: 0.22, annualIncrease: 0.03}`

Regression check:
- The router and export paths both apply the same V2 override.
- This is no longer "architecturally unreachable"; the data layer now forces the workbook bug back into the replica input.

Verdict:
- RESOLVED

Reasoning:
- Both known replica gaps are now explicitly implemented.
- The V2 bug is reproduced at the correct architectural layer: before the engine sees pre-aggregated prices.

### 7. `computeDiscountFactors` dead code

Commit reference:
- No post-audit commit. No working-tree change addresses this item.

Current code:

```ts
const rr = computeRealInterestRate(
  input.interestRate,
  input.inflationRate,
  config.formulaMode,
);
computeDiscountFactors(rr, input.referencePeriod);
```

Probe results:
- `rg -n "Math\\.pow\\(1 \\+ realRate|Math\\.pow\\(1 \\+ interestRate|computeDiscountFactors\\(" src tests`
- Remaining inline discounting:
- `src/engine/energy.ts:54`
- `src/engine/maintenance.ts:47,97,103`
- `src/engine/residual.ts:40`
- `src/engine/income.ts:42`

Verdict:
- NOT ADDRESSED

Reasoning:
- The function is still computed and discarded.
- The intended refactor to a shared discount-factor array did not happen.

### 8. KPI renaming

Commit reference:
- No post-audit commit. No working-tree change addresses this item.

Current code:

```ts
// AGG-014: KPIs — divisor is investmentCost (construction + design + site mgmt), NOT LCC
const kpiDesignOverLCC = safeRatio(designCosts, investmentCost);
const kpiConstructionOverLCC = safeRatio(totalMaterials, investmentCost);
const kpiLaborOverLCC = safeRatio(totalLabor, investmentCost);
const kpiOMOverLCC = safeRatio(operationAndMaintenance, investmentCost);
```

```tsx
{ label: "Design / LCC", value: result.kpiDesignOverLCC },
{ label: "Construction / LCC", value: result.kpiConstructionOverLCC },
{ label: "Labor / LCC", value: result.kpiLaborOverLCC },
{ label: "O&M / LCC", value: result.kpiOMOverLCC },
```

Verdict:
- NOT ADDRESSED

Reasoning:
- The code comments know the divisor is investment cost.
- The exported fields and UI labels still say `/ LCC`, which is materially misleading.

### 9. Test fixture regeneration

Commit reference:
- No post-audit commit. No working-tree change addresses fixture provenance.

Current fixture metadata:

```json
"meta": {
  "description": "Golden reference dataset for LCC engine tests. Values computed step-by-step from formula specifications. Base variant, 40-year period, excel_bugfixed mode.",
  "referencePeriod": 40,
  "formulaMode": "excel_bugfixed",
  "generated": "2026-03-26"
}
```

Probe results:
- No script in `scripts/` references `excel-reference.json`.
- Fixture vs current engine:
- `fixture.expected.realInterestRate = 0.009447096260938745`
- `calculateLCC(fixture.input).realInterestRate = 0.0094` after engine rounding
- `fixture.expected.aggregate.lcc = 1552506.3982301466`
- `calculateLCC(fixture.input).lcc = 1552506.4`
- `fixture.expected.kpis.kpiConstructionOverLCC = 0.5460385438972163`
- `calculateLCC(fixture.input).kpiConstructionOverLCC = 0.546`
- Workbook cached cells from `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` do not match the fixture:
- `Project Information!D125 = 0.009499468029790332`
- `Results!B62 = 0`
- `Results!B66 = 0`
- `Results!B82 = #DIV/0!`

Verdict:
- NOT ADDRESSED

Reasoning:
- The fixture is still engine-derived.
- The workbook and the fixture are not even the same scenario; there is no provenance chain from workbook cached values to the JSON file.

### 10. Documentation drift

Commit reference:
- No post-audit commit. No working-tree change addresses the documentation items.

Current documentation evidence:
- `docs/formula-map.md:16` still labels FIN-001 sheet as `PI`, not `Project Information`.
- `docs/formula-map.md:23` still uses `INDEX('PI'!...)`.
- `docs/formula-map.md:28` still maps NRG-006 PV nominal to `Calc D30`, but workbook evidence is `Calc D29 = D28*'Project Information'!$G$171` and `Calc D30 = D29*D8`.
- `docs/formula-map.md:36` still says `PI!D175` for MNT-002.
- `docs/architecture-decisions.md:31-49` documents formula modes generically but does not record the adopted FIN-001 policy or the new `otherCost` policy.

Verdict:
- NOT ADDRESSED

Reasoning:
- The documentation still reflects the pre-fix state in the exact places the prior report flagged.

### 11. Dual-system source UI gap

Commit reference:
- UNCOMMITTED. No post-audit fix commit exists in git history for this change.

Current code:

```tsx
<TableHead className="w-[200px]">Source 1</TableHead>
<TableHead>System 1 (kWh/m2/yr)</TableHead>
<TableHead className="w-[200px]">Source 2</TableHead>
<TableHead>System 2 (kWh/m2/yr)</TableHead>
```

```tsx
<Controller
  name={`${fields.sys2}.energySourceIndex`}
  control={form.control}
  render={({ field }) => (
    <Select ...>
```

Verdict:
- RESOLVED

Reasoning:
- The UI now exposes separate source selectors for `HEATING_2`, `COOLING_2`, and `DHW_2`.
- That is consistent with the backend model and removes the earlier integration mismatch.

## Section 4 - Regressions

- No fix commit exists.
  - Reproduction: `git log --since="2026-03-26"` contains no commit that records these changes.
  - Impact: the code changed, but the policy rationale is not reviewable or attributable.

- Land price UX is now ambiguous relative to the corrected math.
  - Reproduction: `src/components/forms/wlc-form.tsx:406` still says `Land Price` while `_shared.ts` now multiplies it by `landArea`.
  - Expected: label should make unit semantics explicit, e.g. `Land Price (EUR/m2)` or field should be renamed to total.
  - Actual: user can plausibly enter total EUR and have it multiplied again.

- MNT-BUG-001 remains order-dependent at the raw engine boundary.
  - Reproduction: same two service components, reversed array order, `formulaMode='excel_replica'`.
  - Expected: identical result if the bug is truly tied to workbook row identity.
  - Actual: `3712.3149691012404` vs `3482.4397812204297`.

## Section 5 - Residual Risk

The chosen FIN-001 policy is correct and defensible, but it is only present in code. If another engineer re-audits by reading `docs/architecture-decisions.md` alone, they will not know that the team chose outcome (b) instead of outcome (a) or (c).

The chosen `otherCost` policy is also defensible and internally consistent. The remaining risk is not arithmetic; it is governance. The schema supports `otherCost`, the engine now makes it mode-dependent, but no document explains that this is a deliberate semantic superset in `excel_bugfixed` and an exclusion in `excel_replica`.

The `excel_replica` completeness policy is the weakest area. The team clearly intends full workbook fidelity, and the energy replica gaps were fixed, but maintenance replica fidelity still depends on caller ordering conventions instead of a workbook-stable identity. That is a fragile approximation, not a true replica guarantee.

## Section 6 - Test Suite Assessment

- The fixture still does not reflect the workbook.
  - `tests/fixtures/excel-reference.json` is still engine-derived.
  - No extraction script in `scripts/` writes the fixture.
  - The fixture metadata itself says values were "computed step-by-step from formula specifications", not extracted from workbook cached cells.

- New tests do cover several previously missing edge cases.
  - `tests/engine/discount.test.ts` now checks replica RR against `0.009499468029790332`.
  - `tests/engine/energy.test.ts` now checks the household DHW-growth bug in `excel_replica`.
  - `tests/engine/edge-cases.test.ts` now checks zero-area explicit PV production.
  - `tests/engine/replica-parity.test.ts` checks the `otherCost` mode split.
  - `tests/server/build-variant-input.test.ts` checks land cost mapping, `replicaOrder`, and V2 price override.

- There is now a test that would have caught FIN-001.
  - Yes, but only for `excel_replica`.
  - There is still no workbook-backed golden proving that the rest of the fixture outputs came from Excel rather than the engine.

## Section 7 - Remaining Work

- Commit the current fixes with explicit subjects referencing FIN-001 policy, `otherCost` policy, and replica completeness scope.
- Change the WLC UI label from `Land Price` to a unit-explicit label, or rename the field to total price and revert the multiplication.
- Replace the row-62 "last component" approximation with a stable workbook identity for replica mode, or explicitly document that MNT-BUG-001 is not fully replicated.
- Regenerate `tests/fixtures/excel-reference.json` from workbook data or a reproducible extraction script, and document provenance.
- Rename KPI fields and UI labels to `...OverInvestmentCost`, or add a versioned alias and deprecation note.
- Update `docs/formula-map.md` and `docs/architecture-decisions.md` to reflect the actual policies now implemented in code.

# Sensitivity Analysis — Implementation Spec (Pernetti et al. 2021 methodology)

**Date:** 2026-05-16
**Last revision:** 2026-05-16 (after full-text extraction of the paper PDF)
**Author:** Claude + Federico
**Status:** Design proposal, not yet executed
**Companion docs:**
- [2026-05-15-independent-audit-lcc-methodology-codebase.md](./2026-05-15-independent-audit-lcc-methodology-codebase.md) §3.6 (uncertainty proposal)
- [2026-05-15-operative-plan.md](./2026-05-15-operative-plan.md) §6 / §11 (uncertainty roadmap)
- Source PDF: `C:\Users\FGarzia\Downloads\1-s2.0-S2210670721004212-main.pdf` (extracted to plain text on 2026-05-16; all bounds, equations and algorithm choices below come from the PDF directly).
- Memory: `publication-pernetti-garzia-2021.md` (paper summary — superseded by this spec for SA-specific details).

---

## 1. Source of methodology

Reference: **Pernetti R., Garzia F., Filippi Oberegger U. (2021).** *Sensitivity analysis as support for reliable life cycle cost evaluation applied to eleven nearly zero-energy buildings in Europe.* Sustainable Cities and Society 74, 103139. https://doi.org/10.1016/j.scs.2021.103139

**Source basis:** full text extracted from `C:\Users\FGarzia\Downloads\1-s2.0-S2210670721004212-main.pdf` on 2026-05-16. All equations, table values and algorithmic choices below are quoted directly from the PDF (not from the abstract or memory note). Bounds and distributions originate from EN 15459 / Eurostat / FRED / industry interviews as cited in the paper's Tables 2 and 3.

### 1.1 What the paper does

Combined **two-stage SA**, designed to balance reliability with computational effort:

1. **Stage A — DSA (Differential Sensitivity Analysis):** local, one-at-a-time (OAT), fixed perturbation ±10 % on every candidate input. Sensitivity index (paper Eq. 3):
   `s = (ΔO / O_b) / (ΔI / I_b)`
   where `O` = LCC, `I` = input, subscript `b` = baseline. Used to **rank** inputs by influence and screen out negligible ones.

2. **Stage B — EE (Elementary Effects, Morris 1991 + Campolongo et al. 2007), with paper-specific modification:** quasi-global screening at `p = 4` discrete levels. Step size:
   `Δ_i = (M_i − m_i) / (2·(p − 1)) = (M_i − m_i) / 6`
   where `[m_i, M_i]` is the variation range for parameter `i`.

   **Modified EE definition (paper Eq. 4):**
   `EE_i = f(x_1, …, x_i + Δ_i, …, x_n) − f(x_1, …, x_n)`
   **Not divided by Δ_i** — this is the paper's deliberate departure from the literature Morris definition. Consequence: `EE_i` is in **absolute LCC units (€)**, not dimensionless. The paper justifies this as "easier to interpret because it directly represents the absolute effect on the output without any scaling factor"; relative ranking is unchanged.

   **Three sensitivity indices per input (Eqs. 5, 6, 7):**
   - `μ_i` = mean(EE_ij) over `r` trajectories — signed; vulnerable to Type II error when positive and negative effects cancel.
   - `σ_i` = stdev(EE_ij) — captures non-linearity and parameter interactions.
   - `μ*_i` = mean(|EE_ij|) — robust importance indicator, introduced specifically to overcome the cancellation problem.

   **Trajectory selection (Campolongo screening, paper's variant):**
   - Generate **10 000 random trajectories** in the unit hypercube at `p = 4` levels.
   - Draw **100 random samples of 10 trajectories each** from those 10 000.
   - For each sample compute the **spread** = sum of all pairwise distances (Eq. 8) between its 10 trajectories.
   - Select the **single sample of 10 with the largest spread** → `r = 10`.
   - This is *not* exhaustive enumeration of `C(10000, 10)`; cost is `O(100 × C(10, 2) × n) = O(4500 · n)` distance computations.
   - For `n ∈ [14, 21]` input factors → `r · (n + 1) = 150–220` LCC evaluations per case study.

3. **Variation schemes (paper §2.2.1):** two complementary runs per case:
   - **Fixed percentage:** ±10 % around the baseline, applied to every input. Always available.
   - **Reference values:** literature-based per-input ranges, available only for the *boundary conditions* category (Table 2). For *energy demand* and *construction costs* (Table 3) only ±10 % is used, because only the baseline values were known from the case studies.

4. **Simplified EE validation (paper Table 4 + Fig. 6):** the paper's headline practical result. Running EE with **reference values** only on the **top-4 DSA-ranked parameters**, keeping the other inputs at baseline, reproduces the detailed-EE distribution (all 14–21 inputs) within:
   - median LCC diff: **−8 % to +6 %**, average **+2.5 %**
   - 25th-percentile diff: **−2 %** (slight underestimation)
   - 75th-percentile diff: **+2 %** (slight overestimation)

   → **DSA-then-simplified-EE is the actionable recipe** for our tool.

### 1.2 Dominant parameters identified

Across 11 nZEB buildings, the top-4 are stable:

| Rank | Parameter | DSA relative effect (±10 %) |
|------|-----------|-----------------------------|
| 1 | Interest rate (discount rate) | 13.4 % |
| 2 | Construction cost — structural elements | 12.2 % |
| 3 | Maintenance cost — construction (building elements) | 11.7 % |
| 4 | Maintenance cost — HVAC (services) | 10.2 % |

LCC variability around the median: 15–30 % typical, up to 37 % (Case "More"), average 26 %.

### 1.3 Boundary conditions

- ISO 15686-5:2017 NPV
- Reference period 40 y
- Baseline interest rate 1.51 % (FRED Euro-area average 2009–2016)
- Maintenance per EN 15459:2017 (building elements 1.5 % envelope baseline)
- End-of-life excluded
- Income / co-benefits **not** in paper's LCC; orthogonal to SA

---

## 2. Current engine — integration points

Recap of what we already have ([src/engine/index.ts](../../src/engine/index.ts), [src/engine/types.ts](../../src/engine/types.ts)):

- `calculateLCC(input: VariantInput, config: EngineConfig): LCCResult` — **pure function**, no side effects, no I/O.
- `VariantInput` packs everything: `interestRate`, `inflationRate`, `referencePeriod`, `treatedFloorArea`, `energyPrices[]`, `energyInputs[]`, `costItems[]`, `serviceComponents[]`, `buildingElementMaintenancePercent`, `wlcInput`, `designCosts[]`, optional `incomeInput`.
- `LCCResult` exposes scalars suitable as SA outputs: `lcc`, `wlc`, `lccNetResidual`, `kpiLCCPerM2`, `kpiWLCPerM2`, `kpiOMOverInvestmentCost`, `kpiConstructionOverInvestmentCost`, plus the income block.
- tRPC entry [src/server/trpc/routers/calculation.ts](../../src/server/trpc/routers/calculation.ts) just calls the engine. **No statistical deps in package.json.**

This is structurally ideal for SA: pure deterministic function, scalar outputs, no async, no DB inside the engine.

### 2.1 Mapping the paper's 4 dominant parameters to current inputs

| Paper parameter | Engine handle | Notes |
|---|---|---|
| Interest rate | `input.interestRate` (scalar) | Direct scalar perturbation. |
| Construction cost — structural | `input.costItems` filtered by `category == 'A9_STRUCTURE'`; perturb `materialCost + laborCost + otherCost` proportionally | Already isolated by category. |
| Maintenance cost — construction | `input.buildingElementMaintenancePercent` (scalar, applies to `getBuildingElementConstructionBase`) | Direct scalar. |
| Maintenance cost — HVAC | Per-service `maintenancePctAvg` resolved inside [src/engine/maintenance.ts](../../src/engine/maintenance.ts) from `getEN15459Component(sc.en15459ComponentIndex)` | Needs an indirection: see §3.2. |

### 2.2 Additional parameters worth exposing (paper Stage A screened ~14–21 inputs)

| Parameter | Engine handle |
|---|---|
| Inflation rate | `input.inflationRate` |
| Electricity price (per energy source) | `input.energyPrices[i].pricePerKwh` |
| Annual energy-price escalation | `input.energyPrices[i].annualIncrease` |
| Specific energy consumption (per end use) | `input.energyInputs[i].specificConsumption` |
| PV production | `input.energyInputs[i].pvProductionKwh` |
| Service-component lifespan | from EN 15459 `lifespanAvg` (bounds available: `lifespanMin/Max`) |
| Service-component cost | `input.serviceComponents[i].constructionCost` |
| Construction cost — facades / roofs / windows | `costItems` filtered by `A1_ROOFS`, `A2_FACADES`, `A5_WINDOWS` |
| Land cost / financing / design / site mgmt | `input.wlcInput.*` (scalars) |

---

## 3. Architecture

### 3.1 New module `src/engine/sensitivity/`

```
src/engine/sensitivity/
  index.ts              // public API: runDSA, runEE
  parameters.ts         // ParameterSpec, registry, get/set lenses
  sampling.ts           // Morris trajectories + Campolongo screening
  dsa.ts                // DSA driver (OAT ±delta)
  ee.ts                 // EE driver (μ*, σ aggregation)
  perturbation.ts       // pure VariantInput transformer
  rng.ts                // seedable PRNG (mulberry32) — reproducibility
  types.ts              // SensitivityRun, SAResult, TornadoEntry
  __tests__/...
```

**Constraint:** stays inside `src/engine/` so it remains a pure-TS island (no Prisma, no Next, no DOM). Identical rule as the existing engine modules.

### 3.2 Parameter registry (`parameters.ts`)

A parameter is a *lens* over `VariantInput` — a getter + setter that can read and write a scalar without copying the whole tree by hand.

```ts
export type ParameterId = string;

export interface ParameterSpec {
  id: ParameterId;                 // e.g. "interestRate", "ci.A9_STRUCTURE.total"
  label: string;                   // human-readable
  group: 'finance' | 'construction' | 'maintenance' | 'energy' | 'service' | 'wlc';
  baseline: (input: VariantInput) => number;
  apply: (input: VariantInput, value: number) => VariantInput; // pure
  bounds: {
    min: number;
    max: number;
    distribution: 'uniform' | 'triangular' | 'lognormal';
    mode?: number;        // triangular
    sigma?: number;       // lognormal (geometric stdev)
    source: string;       // citation key, e.g. "fred-euro-area-2009-2016"
  };
}
```

Lenses are pure: each `apply` returns a *new* `VariantInput` with shallow copies of touched arrays/objects. No mutation. The engine receives the fresh input as if from the UI.

**Initial registry — bounds quoted verbatim from paper Tables 2 & 3:**

**Category A — boundary conditions (Table 2 — both ±10 % and literature ranges available):**

| `id` | DSA ±10 % range | Literature range | Distribution (literature) | Source per paper |
|---|---|---|---|---|
| `interestRate` (baseline 0.0151) | [0.0135, 0.0165] | **[0.0025, 0.05]** | uniform | FRED INTDSREZQ193N, Euro area 2009–2016 [48] |
| `buildingElementMaintenancePercent` (baseline 0.015) | [0.0135, 0.0165] | **[0.010, 0.020]** | uniform | EN 15459-1:2017 [51] |
| `service.*.maintenancePctMultiplier` (baseline = `maintenancePctAvg` from EN 15459) | ±10 % around avg | **[`maintenancePctMin`, `maintenancePctMax`]** (already in `constants.ts`) | uniform | EN 15459-1:2017 [51] |
| `energyPrices[carrier=electricity, country=FR].pricePerKwh` (e.g. baseline 0.146 €/kWh — Les Héliades / Alizari) | [0.131, 0.161] | **[0.128, 0.171]** | uniform | Eurostat households 2010–2017 semi-annual [50, 59] |
| `energyPrices[electricity, DE].pricePerKwh` (baseline 0.25) | [0.225, 0.275] | [0.238, 0.305] | uniform | Eurostat / Statista per-country [60] |
| `energyPrices[electricity, IT].pricePerKwh` (baseline 0.21) | [0.189, 0.231] | [0.192, 0.245] | uniform | Eurostat [50] |
| `energyPrices[electricity, SE].pricePerKwh` (baseline 0.12) | [0.108, 0.132] | [0.108, 0.132] | uniform | Eurostat [50] |
| `energyPrices[electricity, AT].pricePerKwh` (baseline 0.20) | [0.18, 0.22] | [0.193, 0.208] | uniform | Eurostat [50] |
| `energyPrices[districtHeating, SE].pricePerKwh` (baseline 0.187) | [0.168, 0.206] | [0.184, 0.210] | uniform | Industry partners + EN 15459 [51, 63] |
| `energyPrices[pellet, *].pricePerKwh` (baseline 0.10) | [0.09, 0.11] | [0.09, 0.11] | uniform | [61, 62] |
| `energyPrices[*].annualIncrease` (electricity, FR baseline 0.01) | [0.009, 0.011] | **[0.005, 0.078]** | uniform | Eurostat [50] |
| `energyPrices[*].annualIncrease` (electricity, DE) | [0.009, 0.011] | [0.006, 0.064] | uniform | [60] |
| `energyPrices[*].annualIncrease` (electricity, IT/SE/AT — **can be negative**) | [0.009, 0.011] | up to **[−0.059, +0.037]** for SE, **[−0.029, +0.012]** for AT | uniform, **signed** | [50, 60] |
| `energyPrices[*].annualIncrease` (pellet/heating, can also be negative) | [0.009, 0.011] | spans both signs | uniform | [61, 62] |

**Important:** `annualIncrease` is signed — literature ranges include deflation (e.g. Solällen pellet: −5.9 % to +3.7 %). The lens must **not** clamp negative values; the engine already supports negative `annualIncrease` (verify in `src/engine/energy.ts`).

**Category B — energy demand / PV production (Table 3 — ±10 % only, no literature ranges):**

| `id` | DSA ±10 % | Source |
|---|---|---|
| `energyInputs[heating].specificConsumption` | [0.9, 1.1] × baseline | PHPP modelling, case-specific |
| `energyInputs[cooling].specificConsumption` | [0.9, 1.1] × baseline | PHPP modelling |
| `energyInputs[dhw].specificConsumption` | [0.9, 1.1] × baseline | PHPP modelling |
| `energyInputs[household].specificConsumption` | [0.9, 1.1] × baseline | PHPP modelling |
| `energyInputs[pv].pvProductionKwh` | [0.9, 1.1] × baseline | PHPP modelling |

**Category C — construction costs (Table 3 — ±10 % only):**

| `id` | DSA ±10 % | Source |
|---|---|---|
| `costItems.A9_STRUCTURE.scale` ("structural elements / foundations") | [0.9, 1.1] | Case-study cost ledger |
| `costItems.A1_ROOFS.scale` ("flat roof insulation") | [0.9, 1.1] | Case-study ledger |
| `costItems.A2_FACADES.scale` ("external insulation / facade") | [0.9, 1.1] | Case-study ledger |
| `costItems.A3_FLOORS.scale` ("ground floor insulation") | [0.9, 1.1] | Case-study ledger |
| `costItems.A5_WINDOWS.scale` ("windows") | [0.9, 1.1] | Case-study ledger |
| `costItems.E1_OUTDOOR.scale` ("site and external work") | [0.9, 1.1] | Case-study ledger |
| `serviceComponents.heating.cost.scale` | [0.9, 1.1] | EN 15459 component catalogue |
| `serviceComponents.dhw.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.mechanicalVentilation.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.cooling.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.pv.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.shading.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.buildingAutomation.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.electrical.cost.scale` | [0.9, 1.1] | EN 15459 |
| `serviceComponents.hydraulic.cost.scale` | [0.9, 1.1] | EN 15459 |

**Per the paper, 14–21 input factors per case study.** Our app must offer this exact set so the SA UI can default to the paper-validated configuration; the user can disable individual factors but not invent new categories without breaking the comparison.

Bounds are **defaults**; the user can override per project. Every default carries a `source` citation so the assumption is auditable.

> **Note on `inflationRate`:** the paper does *not* perturb the general inflation rate as a standalone input; it perturbs the per-carrier `energy price annual increase`. Our `input.inflationRate` (used for real-rate computation via Fisher) is a *boundary condition* not exposed in the SA registry to stay faithful to the paper. If we later want to include it, document the deviation explicitly.

> **HVAC maintenance multiplier — implementation note**
> The `maintenancePctMultiplier` is a number that scales the EN 15459 `maintenancePctAvg` lookup *for that service-component instance*. We **do not** mutate the `constants.ts` table; instead we add an optional `maintenancePctOverride?: number` (already computed) to `ServiceComponentInput` and update `maintenance.ts` to prefer the override when present. The SA harness writes overrides via the lens; everyone else ignores it. Same pattern for lifespan.

### 3.3 Perturbation contract

```ts
function perturb(
  input: VariantInput,
  params: ReadonlyArray<{ spec: ParameterSpec; value: number }>,
): VariantInput;
```

- Always returns a fresh `VariantInput`.
- Independent perturbations compose by fold: `params.reduce((acc, p) => p.spec.apply(acc, p.value), input)`.
- **Invariant:** `perturb(input, []) ≡ structuredClone(input)` → identity, no drift.
- **Determinism test:** for any seed and any param vector, two runs produce byte-identical `LCCResult` JSON.

### 3.4 DSA driver (`dsa.ts`)

```ts
export interface DSAConfig {
  parameters: ParameterId[];   // which to perturb
  outputs: OutputId[];         // 'lcc' | 'lccNetResidual' | 'kpiLCCPerM2' | ...
  delta: number;               // 0.10 default = ±10 %
  baseline?: LCCResult;        // optional precomputed
}

export interface DSAEntry {
  parameterId: ParameterId;
  output: OutputId;
  baselineOutput: number;
  plusValue: number;     // I_b * (1+delta)
  minusValue: number;    // I_b * (1-delta)
  plusOutput: number;
  minusOutput: number;
  relativeChangePlus: number;   // (O_plus - O_b) / O_b
  relativeChangeMinus: number;
  sensitivityIndex: number;     // 0.5*(|s+| + |s-|), paper-style
}

export function runDSA(input: VariantInput, cfg: DSAConfig): {
  baseline: LCCResult;
  entries: DSAEntry[];    // sorted by |sensitivityIndex| desc
  runs: number;           // 1 + 2*|parameters|*|outputs| (we compute once, slice all outputs)
};
```

**Cost:** `1 + 2·k` engine calls (k = parameter count). With 16 parameters → 33 calls. At even 50 ms/call this is <2 s — single-threaded is fine.

### 3.5 EE driver (`ee.ts`) — paper-faithful

```ts
export interface EEConfig {
  parameters: ParameterId[];
  outputs: OutputId[];
  r: number;                    // selected trajectories (paper: 10)
  rCandidates: number;          // generated pool (paper: 10 000)
  rSamples: number;             // random sample count for Campolongo selection (paper: 100)
  p: number;                    // levels (paper: 4)
  seed: number;                 // PRNG seed (reproducibility)
  variationScheme: 'fixed-10pct' | 'literature-bounds';
}

export interface EEEntry {
  parameterId: ParameterId;
  output: OutputId;
  // Paper-faithful indices: EE_i is the ABSOLUTE difference in LCC (€), not normalised.
  mu: number;           // mean(EE_ij) signed, Eq. 5 — €
  muStar: number;       // mean(|EE_ij|), Eq. 7 — €  (sort key)
  sigma: number;        // stdev(EE_ij), Eq. 6 — €
}

export interface EEDistribution {
  output: OutputId;
  samples: number[];            // all LCC values evaluated across the r·(n+1) runs
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  whiskerLow: number;           // p25 − 1.5·(p75-p25), clipped to min sample
  whiskerHigh: number;          // p75 + 1.5·(p75-p25), clipped to max sample
}

export function runEE(input: VariantInput, cfg: EEConfig): {
  baseline: LCCResult;
  entries: EEEntry[];           // sorted by muStar desc
  distribution: EEDistribution[]; // for box-plot UI per output (paper Fig. 5)
  diagnostics: {
    runs: number;               // r·(k+1)
    elapsedMs: number;
    selectedSampleSpread: number; // spread of the winning 10-trajectory sample
    seed: number;
  };
};
```

**Sampling (`sampling.ts`) — paper-faithful algorithm:**

1. **Build per-parameter level grids.** For parameter `i` with range `[m_i, M_i]`, define `p` equidistant levels `L_i = {m_i, m_i + Δ_i, m_i + 2Δ_i, …, M_i}` where `Δ_i = (M_i − m_i)/(p − 1) = (M_i − m_i)/3` for `p=4`. The Morris step is `δ = p/(2·(p − 1)) = 4/6 = 2/3` of the unit hypercube — equivalently, two grid levels.
2. **Generate `rCandidates = 10 000` random trajectories** using the standard Morris design (Saltelli 2008, §3.2):
   - For each trajectory pick a random base point `x*` on the `(p/2)^n` admissible sub-grid (so adding `δ` stays inside the hypercube).
   - Permute the parameter indices uniformly to choose the order in which they're stepped.
   - Step each parameter exactly once by `±δ` chosen so the result stays in `[0, 1]^n`.
   - Result: `n+1` points where consecutive points differ in exactly one coordinate by `δ`.
3. **Map every coordinate through the inverse CDF** of the parameter's distribution → physical-units value. Uniform: `x → m + (M − m)·x`. Triangular: standard inverse-CDF formula.
4. **Campolongo selection (paper variant, NOT brute force enumeration):**
   ```
   bestSpread = -∞; bestSample = null;
   for s in 1..100:
     sample = random.choice(candidates, k=10, replace=false)  // PRNG seeded
     spread = sum over all i<j in sample of euclideanDistanceBetweenTrajectories(sample[i], sample[j])
     if spread > bestSpread:
       bestSpread = spread; bestSample = sample
   return bestSample  // exactly 10 trajectories
   ```
   The pairwise trajectory distance (paper Eq. 8) is the sum of Euclidean distances between **every** point of trajectory `k` and **every** point of trajectory `l` (not just corresponding points).
5. **Each selected trajectory generates `n+1` LCC runs**, one per `(parameter, point)` transition produces one `EE_i` per Eq. 4 — **absolute difference, not divided by Δ_i**.
6. **Aggregate** the `r = 10` `EE_ij` values per parameter into `μ_i`, `σ_i`, `μ*_i` (Eqs. 5–7). Also collect all `r·(n+1)` LCC values for the box-plot distribution (paper Fig. 5).

**Cost:** `r · (n + 1)` engine calls. With `r = 10`, `n = 16` → 170 calls. Matches paper's "150–220 runs/case". Trajectory generation + selection is negligible (<10 ms even for `rCandidates = 10 000`).

**Why `EE` is in € and not dimensionless:** the paper deliberately drops the `/Δ_i` normalisation (§2.2.3, modification to Eq. 4) so that `μ*` reads directly as "average absolute LCC change per Morris step." UI tooltip must show units; never display μ*/σ as "percentage".

### 3.6 RNG (`rng.ts`)

Seeded `mulberry32` PRNG, ~10 lines, no deps. Required for reproducibility (same seed → byte-identical EE results). Stored alongside results so runs can be replayed.

### 3.7 No worker thread (yet)

Per [[decision-uncertainty-architecture]]: **profile single `calculateLCC` first**. Decision rule:
- If 95th-percentile `calculateLCC` ≤ 5 ms on production-size WBS → run EE inline in the tRPC procedure (170 runs ≤ 1 s, acceptable on a query).
- If > 5 ms → use `node:worker_threads` with one worker per CPU; chunk trajectories.
- If > 50 ms (large WBS) and EE > 10 s → background job (Postgres queue + polling).

Worker-thread plumbing is **out of scope for phase 1**. Add only when profiling demands it.

---

## 4. Persistence

### 4.1 Prisma additions

```prisma
model SensitivityRun {
  id              String            @id @default(cuid())
  variantId       String
  variant         Variant           @relation(fields: [variantId], references: [id], onDelete: Cascade)
  method          SAMethod          // DSA | EE
  config          Json              // DSAConfig | EEConfig snapshot
  parameterSpecs  Json              // resolved ParameterSpec[] (with bounds + sources)
  baselineSnapshot Json             // LCCResult baseline used
  result          Json              // DSAEntry[] | EEEntry[]
  diagnostics     Json?             // EE runs/elapsed/spread, DSA call count
  engineVersion   String
  formulaMode     FormulaMode
  methodProfile   String            // MethodProfileId
  seed            Int?              // EE only
  createdAt       DateTime          @default(now())
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])

  @@index([variantId, method, createdAt])
}

enum SAMethod {
  DSA
  EE
}
```

**Rules:**
- Immutable: once written, never updated. New parameters / new bounds = new run.
- `parameterSpecs` is the *resolved* spec (with concrete numeric bounds, not just IDs) so historical runs remain interpretable when defaults evolve.
- `baselineSnapshot` is the full `LCCResult` so the run is self-contained and reproducible without re-running the engine.

### 4.2 No engine snapshot pollution

`LCCResult` does **not** gain SA fields. SA is a sibling of LCC, not part of it. Snapshot hash for `LCCResult` stays unchanged.

---

## 5. tRPC API

```ts
// src/server/trpc/routers/sensitivity.ts
export const sensitivityRouter = createTRPCRouter({
  listParameters: protectedProcedure
    .input(z.object({ variantId: z.string() }))
    .query(async ({ ctx, input }) => {
      // returns the parameter registry resolved for this variant
      // (e.g. enumerates A1..A10 categories actually present in costItems,
      //  service components actually configured, energy sources actually used)
    }),

  runDSA: protectedProcedure
    .input(z.object({
      variantId: z.string(),
      parameters: z.array(z.string()).min(1).max(40),
      outputs: z.array(z.enum(['lcc', 'lccNetResidual', 'kpiLCCPerM2'])).min(1),
      delta: z.number().positive().max(0.5).default(0.10),
      formulaMode: z.enum(['excel_replica','excel_bugfixed']).default('excel_bugfixed'),
    }))
    .mutation(async ({ ctx, input }) => {
      const variantInput = await loadVariantInput(ctx.db, input.variantId);
      const baseline = calculateLCC(variantInput, { formulaMode: input.formulaMode });
      const dsa = runDSA(variantInput, { ...input, baseline });
      return ctx.db.sensitivityRun.create({ data: { ... } });
    }),

  runEE: protectedProcedure
    .input(z.object({
      variantId: z.string(),
      parameters: z.array(z.string()).min(2).max(40),
      outputs: z.array(z.enum(['lcc', 'lccNetResidual', 'kpiLCCPerM2'])).min(1),
      r: z.number().int().min(4).max(50).default(10),
      p: z.number().int().min(4).max(10).default(4),
      seed: z.number().int().default(42),
      variationScheme: z.enum(['fixed-10pct','literature-bounds']).default('literature-bounds'),
      formulaMode: z.enum(['excel_replica','excel_bugfixed']).default('excel_bugfixed'),
    }))
    .mutation(...),

  listRuns: protectedProcedure
    .input(z.object({ variantId: z.string() }))
    .query(...),

  getRun: protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(...),
});
```

Mutations (not queries) because they create persistent records.

---

## 6. UI

### 6.1 New tab in `/projects/[id]/results/`

Add a `Sensitivity` tab alongside the existing dashboard. Default state: "Run sensitivity analysis" empty state with two CTAs:

- **Quick screen (DSA, ±10 %)** — 1-click, runs against the paper's top-4 parameters by default. ~33 engine calls.
- **Detailed analysis (Morris EE)** — opens a parameter picker, lets the user choose `r`, scheme; ~170 calls.

### 6.2 Visualisations — reproduce paper figures

Built on existing `recharts` — no new chart lib. Each chart maps one-to-one to a figure in the paper so the user reads "Pernetti et al. 2021 applied to my project":

1. **Ranked bar chart with error markers (DSA result, reproduces paper Fig. 1 & Fig. 2)** — horizontal bars: bar length = `s_i` (relative change), white-circle marker = `σ_i` (cross-case stdev). Sort by `s_i` desc. **Single chart per DSA run**, optionally one panel per variation scheme (`fixed-10pct` vs `literature-bounds`).
2. **Tornado plot (DSA drill-down)** — horizontal bars centred at baseline, length = ±Δ LCC for `+Δ_i` and `−Δ_i`. Click a parameter row in the ranked bar → tornado panel for that single parameter. Useful when the user wants the per-direction effect, not just the magnitude.
3. **μ*–σ scatter (EE result, reproduces paper Fig. 3 & Fig. 4)** — parameters as points, x = μ* (€), y = σ (€). Top-right quadrant = high importance + high non-linearity/interaction. Diagonal reference line `σ = μ*` to read interaction strength at a glance. Log-log toggle for the `literature-bounds` scheme (paper Fig. 4 used log scale because interest rate and energy-price-inflation dominate by an order of magnitude).
4. **Box plot of LCC distribution (EE result, reproduces paper Fig. 5)** — box from `p25` to `p75`, line at median, whiskers at `±1.5·IQR` clipped to observed min/max. Compute over all `r·(n+1)` LCC values from `distribution[output].samples`. One box per output (`lcc`, `lccNetResidual`, `kpiLCCPerM2`).
5. **4-panel comparison (advanced, optional in SA-2)** — paper Fig. 6: four box plots side-by-side comparing DSA-fixed, DSA-literature, EE-fixed, EE-literature against EE-literature as reference. Implement as overlapping translucent boxes. **Defer to SA-3** if it bloats SA-2 scope.
6. **Run history table** — past runs with method, parameters, outputs, timestamp, engineVersion, methodProfile. Restore-to-view.

### 6.3 Methodology card

A reused `ReferenceButton` block that cites Pernetti 2021, Morris 1991, Campolongo 2007, ISO 15686-5, EN 15459. Critical for academic credibility.

### 6.4 Honest copy update

Concurrently update the existing landing claims flagged in the audit ([2026-05-15-independent-audit-lcc-methodology-codebase.md](./2026-05-15-independent-audit-lcc-methodology-codebase.md)):
- [src/components/landing/value-cards.tsx](../../src/components/landing/value-cards.tsx) — change "Sensitivity-ready method" wording **from "planned"** to factual once shipped.
- [src/components/landing/what-it-does.tsx](../../src/components/landing/what-it-does.tsx) — drop "planned as an embedded module" once DSA ships.
- [src/components/landing/methodology-card.tsx](../../src/components/landing/methodology-card.tsx) — "DSA + Elementary Effects planned" → "DSA + Elementary Effects".

---

## 7. Testing strategy

| Layer | Test |
|---|---|
| `parameters.ts` | For every spec: `apply(input, baseline(input))` is a no-op (`calculateLCC` output identical). |
| `perturbation.ts` | Independence: perturbing A then B = perturbing B then A. Idempotence: identity element returns clone. |
| `rng.ts` | Same seed → same sequence (1000 draws golden). |
| `sampling.ts` | Generated trajectories: every coordinate lies in the unit hypercube; every trajectory has exactly k+1 points differing in exactly one dimension per step. |
| `dsa.ts` | On a synthetic linear LCC (`Y = a·x1 + b·x2`), recovered s_i match analytic value within 1e-9. |
| `ee.ts` | On Morris's *g-function* benchmark (Saltelli 2008 test bed), recovered μ*/σ ranking matches published reference within tolerance. |
| `ee.ts` | Reproducibility: same seed + same inputs → byte-identical `EEEntry[]`. |
| Integration | Replay any 11 nZEB-like fixture; top-4 parameter ranking includes interest rate and structural construction cost (sanity check against paper). |
| tRPC | Authorisation: only project members can run; runs are tied to `createdById`. |

---

## 8. Performance budget (to confirm with profiling)

| Run | Engine calls | Target latency (single-threaded) |
|---|---|---|
| DSA, 16 params, 3 outputs | 33 | < 500 ms p95 |
| EE, r=10, k=16 | 170 | < 3 s p95 |
| EE, r=20, k=30 | 620 | < 12 s — push to background job |

First action of phase 1: add a Vitest benchmark on `calculateLCC` with a 100-cost-item / 30-service-component fixture. Numbers drive worker-thread decision.

---

## 9. Phased rollout (recommended)

### Phase SA-0 — Paper-replication fixture (parallel with SA-1, ≈ 2 days)
- Add a Vitest fixture for one paper case study with the most documented data. Best candidate: **Väla Gård** (Helsingborg, office, 1670 m², Swedish data fully in paper Tables 1+3).
- Encode the variant inputs from paper Table 1 + Table 3 into a Prisma seed.
- Write a `replica.spec.ts` that runs DSA + simplified EE and asserts: top-4 ranking contains `interestRate`, `costItems.A9_STRUCTURE.scale`, `buildingElementMaintenancePercent`, `service.HVAC.maintenancePctMultiplier` (in some order).
- Assert LCC variation 15–37 % around median, average ~26 %.
- This is both the **regression test** that protects the SA module across refactors AND the **landing-page proof artefact** ("we replicate the paper inside the app").

### Phase SA-1 — DSA only, minimum viable (≈ 1.5 weeks)
- `parameters.ts` registry with paper's top-4 + interest, inflation, structural, building-elem maintenance, HVAC multiplier.
- `dsa.ts`, perturbation, RNG (used later by EE).
- Prisma `SensitivityRun` + `SAMethod` enum.
- tRPC `listParameters`, `runDSA`, `listRuns`, `getRun`.
- UI: tornado plot + run history.
- Tests: parameter no-op, DSA on synthetic linear LCC, integration on a seeded variant.
- Update landing copy for DSA only ("DSA shipped, EE planned").

**Deliverable:** user can run a one-click ±10 % sensitivity on any variant, see a ranked tornado, persist the run.

### Phase SA-2 — Elementary Effects (≈ 2 weeks)
- `sampling.ts` (Morris + Campolongo screening).
- `ee.ts` (μ*, σ aggregation).
- Extend parameter registry to ~16 inputs with literature bounds.
- UI: μ*–σ scatter + EE-detail drawer.
- Vitest benchmark on `calculateLCC` to decide worker-thread.
- Tests: Morris g-function ranking sanity, reproducibility.
- Update landing copy: drop "planned".

**Deliverable:** user can run a Morris EE screen on a chosen parameter set, see μ*/σ, replay any historical run.

### Phase SA-3 — Optional extensions (after SA-1/2 land)
- Latin Hypercube Sampling + Monte Carlo for output distributions (P10 / P50 / P90).
- Worker-thread pool if profiling demands it.
- Background job (Postgres queue) for >10 s runs.
- Sobol indices (Saltelli 2010) — only after EE confirms which parameters justify the cost.
- Export sensitivity report in PDF/Excel snapshot.

Each is an independent ticket; none belongs to v2.0 EPBD work.

---

## 10. Open questions — resolved after re-reading the paper

1. **Default bounds source list** — **RESOLVED**: use Tables 2 & 3 of the paper verbatim for SA-1/SA-2 defaults. The full literature ranges are now encoded in §3.2 with explicit citations to the paper's reference numbers ([48], [50], [51], [59]…). Each per-country electricity price has a documented source. SA-3 may later wire to a `ReferenceData` Prisma table for live updates (per `decision-scenario-data-versioning`), but **paper defaults take precedence as ground truth** until that exists.
2. **Maintenance HVAC override mechanism** — **RESOLVED**: add optional `maintenancePctOverride` / `lifespanOverride` to `ServiceComponentInput`. They are populated only by SA lenses; engine code prefers override when present, falls back to EN 15459 lookup otherwise. Assert in tests that absent overrides leave `excel_replica` hash unchanged.
3. **Output selection** — **RESOLVED**: ship with `lcc`, `lccNetResidual`, `kpiLCCPerM2` in SA-1. The paper uses LCC only; `lccNetResidual` is our enhancement (ISO 15686-5 residual value); `kpiLCCPerM2` matches the paper's per-m² reporting in Fig. 5. Expand later if requested.
4. **Methodology profile gating** — **RESOLVED**: yes, block SA on metadata-only profiles. Button disabled with tooltip pointing to [[decision-epbd-profile-gate]].
5. **Trajectory-screening cost** — **RESOLVED**: paper does NOT do brute-force enumeration of `C(10000, 10)`. It draws 100 random samples of 10 trajectories and picks the max-spread sample. Implementation in §3.5 step 4 above. Cost is trivially `O(100·45·n)` distance computations — single-millisecond range. **No fallback needed.**

### Open questions that remain

A. **PRNG library** — Node has no built-in seeded PRNG with public seed control. Options:
   - Implement `mulberry32` inline (~10 lines, zero deps) — **recommended**.
   - Add `seedrandom` (npm, no transitive deps) — only if the deterministic-test story shows that mulberry32's quality is insufficient for `rCandidates = 10 000` uniform draws (unlikely).

B. **Per-carrier or global energy-price perturbation?** — The paper perturbs *per carrier per country* (Table 2 has one row per carrier×country). Our `input.energyPrices[]` already has one entry per carrier. For SA-1 we expose **per carrier** parameters; the user with multiple carriers gets one parameter per carrier. We do **not** introduce a "country" dimension — the project already encodes that elsewhere (`Project.country`).

C. **Energy-demand perturbation: per end-use or aggregate?** — Paper Table 3 lists heating, cooling, DHW, household, PV separately, each with ±10 %. Expose them as **five separate parameters per variant** so the user can disable irrelevant end-uses (e.g. no cooling for a passive-house residential).

D. **Replication run for paper-replication fixture** — when seeding Väla Gård, we need at least the cost breakdown by category, the service-component list with construction costs, and the four energy-demand values. Paper Table 1 + Table 3 provide enough for a faithful seed, but window-area / treated-floor-area / inflation-rate require interpolation (use Eurac Research's CRAVEzero D6.4 deliverable [58] for the missing fields if accessible). **Action:** before SA-0, confirm we can populate every required `VariantInput` field from the published paper + supplementary; otherwise mark SA-0 fixture as "best-effort approximation" not "paper-exact replication".

---

## 11. Out of scope

- End-of-life cost SA (excluded by paper).
- LCA / carbon SA (covered by future Levels overlay, not by this spec).
- Real-options analysis.
- Bayesian calibration to observed building data.
- Co-benefits SA — orthogonal.

---

## 12. Reproducing the paper's empirical result inside the app

Validation milestone in Phase SA-0 (see §9): ship a Vitest fixture matching one of the 11 nZEB case studies (recommended: *Väla Gård*, Helsingborg, office, fully documented in paper Tables 1+3), run DSA + simplified EE with literature bounds, and verify:

- Top-4 parameter ranking on `lcc` includes interest rate, structural elements cost, maintenance construction, maintenance HVAC — in some order (paper Figs. 1–4 show ordering varies slightly between fixed and literature variants, but the four are stable across both DSA and EE).
- LCC variation across the EE distribution in the 15–37 % range, average ~26 % around median (paper §3.3 + Fig. 5).
- Simplified-vs-detailed EE median discrepancy in [−8 %, +6 %] (paper Table 4) — this is a robustness check, not a strict assertion, since our app implements only "simplified EE" by design.

This regression test guards against silent regressions in the SA module across future refactors AND provides a publication-quality dashboard screenshot for the landing page.

---

## 13. Summary of artefacts to create

| File | Purpose |
|---|---|
| `src/engine/sensitivity/{index,parameters,sampling,dsa,ee,perturbation,rng,types}.ts` | Pure SA engine |
| `src/engine/sensitivity/__tests__/*.test.ts` | Vitest suite |
| `src/server/trpc/routers/sensitivity.ts` | API |
| `src/server/trpc/router.ts` | Register router |
| `src/app/(app)/projects/[id]/results/sensitivity/page.tsx` | UI tab |
| `src/components/results/sensitivity/{tornado,morris-scatter,run-history,parameter-picker}.tsx` | UI components |
| `prisma/schema.prisma` | `SensitivityRun` model + `SAMethod` enum |
| `prisma/migrations/*` | Migration |
| `docs/research/2026-05-16-sensitivity-analysis-implementation-spec.md` | This document |
| `docs/decisions/sensitivity-default-bounds.md` | Versioned default bounds with citations (companion to `decision-scenario-data-versioning`) |

No new runtime dependencies. All work runs on the existing stack: Node 22 + Vitest + Prisma + tRPC + Recharts.

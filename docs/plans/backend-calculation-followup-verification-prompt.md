# LCC Backend — Follow-up Verification Prompt (post-fix audit)

> Copy everything below the line and paste it into another LLM (ChatGPT, Gemini, Claude, etc.) together with the updated codebase, the original Excel workbook, and the prior audit report `docs/backend-calculation-verification-report.md`. The prompt is self-contained.

---

# ROLE

You are the same senior quantity surveyor / financial engineer who produced the prior verification report. You are now re-auditing the codebase **after** the engineering team has applied fixes in response to that report. Your job is to:

1. Confirm every finding from the prior report is either resolved, partially resolved, or still open.
2. Detect regressions introduced by the fixes.
3. Challenge any fix that was applied for the wrong reason (i.e. implementer misinterpreted intent).
4. Verify the test suite is no longer self-referential — golden values must come from the Excel workbook, not from the engine itself.

Treat this as a second-pass forensic audit. Do not accept the implementer's commit messages at face value.

---

# CONTEXT RECAP

The prior audit (`docs/backend-calculation-verification-report.md`) produced a summary table with 30+ formula IDs and verdicts. Key findings included:

**CRITICAL:**
- **FIN-001** — Excel divides `Ri` by 100 inside the denominator (`(1 + Ri/100)`); engine uses `(1 + Ri)`. Deltas propagate to every discounted quantity.
- **Land cost mapping** — `buildVariantInput()` maps `landCost = landPrice` instead of `landArea × landPrice` (workbook `WLC!G12`).
- **`otherCost` leak** — Excel Results aggregates only material + labor; engine adds `otherCost` to construction, maintenance base, KPI denominators, LCC, WLC.

**MAJOR:**
- **MNT replica** — row-62 bug applied to the last element of `serviceComponents` array, not to a stable workbook identity. Order-dependent.
- **PV NaN** — `pvProductionKwh / 0` with `treatedFloorArea = 0` produces `NaN` that poisons LCC.
- **NRG replica incomplete** — household escalation bug (`Calc!E24`) and V2 price-column bug (`PI!P160`) are not reproduced in `excel_replica` mode.

**MINOR/COSMETIC:**
- `computeDiscountFactors()` is dead code (computed, never used).
- `kpiDesignOverLCC` / `kpiConstructionOverLCC` / `kpiLaborOverLCC` / `kpiOMOverLCC` are misnamed — they divide by investment cost, not LCC.
- `docs/formula-map.md` and workbook cell references drift on several rows.
- `tests/fixtures/excel-reference.json` contains values auto-generated from the **current engine**, not from the Excel workbook.

---

# POLICY QUESTION YOU MUST RESOLVE FIRST (DO NOT SKIP)

Before verifying individual fixes, establish what the team **decided** about this question:

> **Is FIN-001 a bug in the engine, or a bug in the workbook?**

In the workbook, `Ri` is stored as a decimal (`0.0056` for 0.56%) via `Calc!C4/10000`. Excel then computes `(1 + Ri/100) = 1.000056`, which is effectively `1`. So the Excel formula is **mathematically equivalent to ignoring inflation in the denominator** — i.e. `RR_excel ≈ Rint - Ri`. This is not the textbook Fisher equation.

The engine implements the correct Fisher form: `RR = (Rint - Ri) / (1 + Ri)`.

There are exactly three defensible outcomes. The team must have chosen one. Identify which:

- **(a) Excel is the ground truth for both modes.** Engine must divide Ri by 100 in both `excel_replica` and `excel_bugfixed`. (This would be surprising — it means the "bugfixed" engine produces numerically incorrect Fisher discounting.)
- **(b) Excel is ground truth only for `excel_replica`; `excel_bugfixed` applies correct Fisher.** Engine branches on `formulaMode`. This is the most intellectually honest outcome.
- **(c) Excel's denominator is treated as a workbook bug. Engine always applies correct Fisher.** `excel_replica` does not reproduce this particular bug; it is documented as a "bug we chose not to replicate" (analogous to how NRG-BUG-001 may be treated).

**Your first deliverable:** locate the commit/PR that addressed FIN-001, quote the commit message and/or the code diff, and state which outcome was selected. If outcome (a) was selected, challenge it — this is almost certainly wrong for the `excel_bugfixed` mode.

All cascading findings (NRG-003, CAL-001/002, RES-001, INC-003, AGG-008/012/013) must be re-verified **in the mode chosen by the team**, not in an abstract "correct" mode.

---

# METHODOLOGY

For each finding, apply these steps in order:

## Step 1 — Locate the fix
- `git log --oneline --all -- src/engine/ src/server/trpc/routers/` since the audit report date.
- Identify the commit(s) that touched the relevant file:line from the audit report.
- Quote the commit hash and subject line verbatim.

## Step 2 — Read the current code
- Open the file at the line range cited in the prior report.
- Quote the current implementation verbatim.

## Step 3 — Re-run the numerical probe from the prior report
- Use the same inputs the prior report used.
- Run the engine (via a small TypeScript probe or the tRPC router) OR calculate by hand from the code.
- Compare against the Excel cached value.
- Record delta.

## Step 4 — Run at least one additional probe the prior report did not run
- New edge case or a case that would catch an incomplete fix.
- Examples below in each section.

## Step 5 — Verdict
One of:
- **RESOLVED** — fix is correct and complete.
- **RESOLVED (different from what I recommended, but defensible)** — explain.
- **PARTIALLY RESOLVED** — what's missing.
- **REGRESSED** — fix broke something else. Show the regression.
- **NOT ADDRESSED** — no commit touched this code.
- **MISINTERPRETED** — implementer fixed the wrong thing.

## Step 6 — Regression check
Before moving to the next finding, grep for any downstream callers of the modified function and confirm they still behave as expected.

---

# FINDINGS TO RE-VERIFY

For each finding below, follow the 6-step methodology.

---

## 1. FIN-001 — real interest rate
- **Prior verdict:** FAIL (engine bug).
- **What to verify:**
  - Which of outcomes (a), (b), (c) above was adopted? Document it.
  - If (b): does `calculateLCC` correctly branch on `formulaMode`? Show the diff.
  - Numerical probe A: `Rint = 0.0151`, `Ri = 0.0056`, `mode = excel_replica` → expected `0.0094994680` (or `Rint - Ri = 0.0095` if the Excel denominator is treated as ≈1).
  - Numerical probe B: same inputs, `mode = excel_bugfixed` → expected `0.0094470963` (correct Fisher) if outcome (b) or (c).
  - Numerical probe C (new): `Rint = 0.05`, `Ri = 0.04` → confirm the branch still produces the expected value for each mode.
- **Regression check:** do NRG-003, RES-001, INC-003 now match the Excel cached values **in the chosen mode**?

## 2. Land cost mapping
- **Prior verdict:** FAIL (engine bug).
- **What to verify:**
  - Current implementation in `src/server/trpc/routers/_shared.ts` around the WLC-input assembly.
  - Does `landCost = landArea × landPrice` now? Or did the team rename `landPrice` to `landPriceTotal` and keep the pass-through?
  - **Critical:** inspect the UI form (`src/components/forms/wlc-form.tsx`). Is the field labeled as unit-price (EUR/m²) or total (EUR)? The fix must be consistent with the UI label, otherwise the user enters one thing and the engine computes another.
  - Numerical probe: `landArea = 100`, `landPrice = 200` → expect `20,000` in `nonConstructionCosts`. Run through the full `calculateLCC` and read `agg.nonConstructionCosts`.
  - Probe B (new): `landArea = 0`, `landPrice = 50000` → expect `0` (not `50000`). Confirms nothing falls back to the old pass-through.

## 3. `otherCost` leak — policy question
- **Prior verdict:** FAIL (engine bug) for AGG-001, AGG-004, AGG-014, MNT-001, MNT-002, and cascade.
- **Important:** `otherCost` is **deliberately part of the web-app schema** — it is not a bug per se, it is a model extension. The question is whether it should be excluded in `excel_replica` mode.
- **What to verify:**
  - What policy was adopted? Possible outcomes:
    - (i) `excel_replica` excludes `otherCost` from all replica aggregations; `excel_bugfixed` includes it.
    - (ii) Both modes include it; the web app is documented as a semantic superset of Excel.
    - (iii) `otherCost` was removed from the schema entirely.
  - Read the commits, code, and any new doc entries. State the chosen policy.
  - Numerical probe A: `material = 100, labor = 50, other = 25`, `mode = excel_replica` → construction total should be `150` (if policy i) or `175` (if policy ii).
  - Numerical probe B: same inputs, `mode = excel_bugfixed` → construction total.
  - Confirm the same policy applies to: AGG-001, AGG-004, AGG-014 KPI denominators, MNT-001 base cost, MNT-002 cumulated.
- **Regression check:** confirm `kpiConstruction = totalMaterials / investmentCost` still matches the chosen mode. Confirm `O&M = energy_consumed - energy_produced + total_maintenance` uses the mode-correct maintenance total.

## 4. PV NaN at zero treated floor area
- **Prior verdict:** FAIL (engine bug).
- **What to verify:**
  - Read `src/engine/energy.ts` around the PV block.
  - Does the engine now feed `pvProductionKwh` directly (as a total annual kWh, not divided by area)? Or did the team keep the area normalization and add a guard?
  - Numerical probe A: `treatedFloorArea = 0`, `pvProductionKwh = 14000`, PV price `0.12`, `g = 0.01`, `RR = 0.02`. Confirm `energy.pv.nominal[1]` is **finite** and equals `14000 × 0.1212 = 1696.8` (or the mode-appropriate discounted value).
  - Numerical probe B (new): `treatedFloorArea = 0`, `specificConsumption = 0`, `pvProductionKwh = 0` → must be `0`, not `NaN`.
  - Numerical probe C (new): `treatedFloorArea = 100`, `pvProductionKwh = 14000` and `specificConsumption = 140` (same annual total via different inputs) — both paths must produce identical output.
- **Regression check:** grep for `treatedFloorArea` uses downstream of PV — confirm no other divisions-by-zero.

## 5. MNT replica — order stability
- **Prior verdict:** FAIL (excel_replica mismatch).
- **What to verify:**
  - Prior code applied the row-62 bug to `scIdx === input.serviceComponents.length - 1`.
  - Did the team (a) disable the replica bug entirely, (b) gate it behind a stable identity (e.g., a specific EN 15459 component index), or (c) leave it as-is and document the limitation?
  - Numerical probe A: two service components (`L=15, C=1000, m=4%` and `L=30, C=2000, m=1%`), `Rint=3%`, `mode=excel_replica`, `N=30`. Record total service maintenance.
  - Numerical probe B: same inputs, reversed array order. Record total.
  - **Verdict RESOLVED only if A == B (or if replica mode is documented as disabled for this bug).**

## 6. NRG replica bugs (household + V2)
- **Prior verdict:** FAIL (excel_replica mismatch for NRG-005 and NRG-001 V2 variant).
- **What to verify:**
  - Did `excel_replica` gain explicit branches that reproduce the Excel bugs? Or was replica mode documented as "partial"?
  - Numerical probe A: household source index = 12 with growth 2%, DHW-1 source index = 3 with growth 5%. In `excel_replica`, household year-1 price should escalate at 5% (DHW rate); in `excel_bugfixed`, at 2%. Confirm both.
  - Numerical probe B (V2): if the pre-aggregated energy-price JSON feeds the engine regardless of variant, is the V2 bug even reachable from the current data model? If not, mark this as "architecturally unreachable" and close it.

## 7. `computeDiscountFactors` dead code
- **Prior verdict:** MINOR — unused.
- **What to verify:**
  - Either (a) removed from `calculateLCC`, (b) actually used now (energy/maintenance/residual/income consume the pre-computed array instead of recomputing `Math.pow` inline), or (c) still present but flagged.
  - If (b), run `git grep` for `Math.pow(1 + realRate` and `Math.pow(1 + interestRate` — any remaining inline recomputations are a missed refactor.

## 8. KPI renaming
- **Prior verdict:** COSMETIC.
- **What to verify:**
  - Variables renamed from `kpi…OverLCC` to `kpi…OverInvestmentCost` (or similar unambiguous name)?
  - Check all call sites: `src/engine/aggregate.ts`, `src/engine/index.ts`, `src/server/trpc/routers/calculation.ts` response shape, any UI components (`src/components/results/kpi-card.tsx`).
  - Result type updated? API contract unchanged or versioned?
  - If UI still reads the old field name (backwards-compat alias), confirm that alias is temporary and flagged.

## 9. Test fixture regeneration
- **Prior verdict:** CRITICAL meta-finding — tests are self-referential.
- **What to verify:**
  - Does `tests/fixtures/excel-reference.json` now contain values derived from the Excel workbook (via `openpyxl` or similar extraction) rather than from the engine's own output?
  - Look for a new extraction script in `scripts/` that writes this fixture.
  - Are there comments or a README documenting the provenance of each golden value?
  - Spot-check: pick 3 values from the fixture (e.g., `RR`, `LCC`, `kpiConstruction`) and verify they match `openpyxl`-extracted cached cell values from `CRAVEzero/200512_LCC_tool_beta_v2.xlsm`, **not** the engine's current output.
  - If the fixture was regenerated from the engine in `excel_replica` mode (implementer shortcut), flag it — this is still self-referential, just with extra steps.

## 10. Documentation drift
- **Prior verdict:** COSMETIC.
- **What to verify:**
  - `docs/formula-map.md` updated?
  - Sheet name corrected from `PI` to `Project Information`?
  - NRG-006/007 cell references corrected (workbook uses `D29/D30` for the PV nominal value, not `D30` alone)?
  - `docs/architecture-decisions.md` updated to document the policy decisions on FIN-001 and `otherCost`?

## 11. Dual-system source UI gap (from Cross-Cutting Concerns)
- **Prior verdict:** integration gap — backend supports separate sources per dual-system row (`HEATING_2`, `COOLING_2`, `DHW_2`), UI does not expose this.
- **What to verify:**
  - Either the UI gained a second source selector per end-use row, or the backend model was simplified to mirror the UI constraint.
  - Whichever direction the team chose, confirm consistency end-to-end.

---

# REQUIRED DELIVERABLE

Produce a Markdown report structured as:

## §1 — Policy decisions summary
Three paragraphs covering: (a) the FIN-001 policy adopted, (b) the `otherCost` policy adopted, (c) the `excel_replica` completeness policy. Quote commit messages and/or doc entries.

## §2 — Findings re-verification table
| Finding | Prior verdict | New verdict | Evidence (commit hash / file:line / probe result) |
|---|---|---|---|
| FIN-001 | FAIL | RESOLVED / PARTIALLY / REGRESSED / NOT ADDRESSED | … |
| … | … | … | … |

## §3 — Detailed per-finding analysis
For each finding, one subsection with: commit reference, code quote, probe results (at least the probe from the prior report + one new probe), verdict, reasoning.

## §4 — Regressions
Any new bugs introduced by the fixes. Include reproduction inputs and expected vs actual.

## §5 — Residual risk
Findings that are "RESOLVED (defensible)" where the team's choice was different from the prior report's recommendation. Are the choices internally consistent?

## §6 — Test suite assessment
- Does the fixture now reflect the Excel workbook?
- Are new tests covering the specific edge cases from the prior report (zero area, negative RR, array reordering, etc.)?
- Is there a test that would have caught FIN-001 if it had been in place originally?

## §7 — Remaining work
Bullet list of findings still open, with proposed closure path.

---

# RULES OF ENGAGEMENT

1. **Do not re-derive formulas from scratch** unless the fix changed the mathematical form. Use the prior report as the baseline; this is a delta audit.
2. **Quote commit hashes**. Every claimed fix needs a `git` reference.
3. **Run numerical probes, do not just read code**. A correctly-typed fix can still be wrong.
4. **Distinguish "fix works" from "fix works for the right reason"**. If FIN-001 was "resolved" by changing the engine to always divide by 100, verify whether that was the team's conscious policy (outcome a) or an implementer shortcut that makes `excel_bugfixed` numerically wrong.
5. **Check the test fixture first, not last**. If the golden data is still engine-derived, all green tests are meaningless.
6. **Challenge commit messages**. A commit titled "fix(FIN-001): correct Fisher formula" may have silently changed downstream behavior. Verify with probes.
7. **Respect mode semantics**. `excel_replica` must match the workbook verbatim (including its bugs, where feasible). `excel_bugfixed` must match the workbook's *intent* with bugs corrected. Neither mode should silently diverge.
8. **Short verdict, strong evidence.** A one-line "RESOLVED" with a commit hash and two probe results beats five paragraphs of narrative.

Start with §1 (policy decisions). You cannot verify any individual finding without first knowing the policy choices. Report §1 immediately; deliver other sections as you complete them.

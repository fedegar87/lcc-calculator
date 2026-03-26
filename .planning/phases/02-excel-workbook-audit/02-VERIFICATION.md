---
phase: 02-excel-workbook-audit
verified: 2026-03-26T14:30:00Z
status: gaps_found
score: 7/8 must-haves verified
re_verification: false
gaps:
  - truth: "EN 15459 JSON contains exactly 79 HVAC components -- success criterion says 80+"
    status: partial
    reason: "scripts/output/en15459.json has count=79. The phase success criterion (from ROADMAP) states '80+ HVAC components'. The plan's own must_have says '79 components'. There is a mismatch between the roadmap success criterion and the delivered artifact. The JSON is internally correct and assertions pass at 79; the discrepancy is in requirement specification."
    artifacts:
      - path: "scripts/output/en15459.json"
        issue: "count=79, roadmap success criterion says 80+"
    missing:
      - "Clarify whether the workbook truly has 79 or 80 components (one sentinel/header row may have been excluded). Update either REQUIREMENTS.md AUDIT-02 or the roadmap success criterion to match reality."
  - truth: "REQUIREMENTS.md AUDIT-04 and AUDIT-05 not marked complete"
    status: failed
    reason: "REQUIREMENTS.md traceability table still shows AUDIT-04 and AUDIT-05 as 'Pending'. Both plans (02-01-SUMMARY, 02-02-SUMMARY) declare requirements-completed: [AUDIT-04, AUDIT-05]. The requirements file was not updated after plan 02-02 execution."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "AUDIT-04 and AUDIT-05 listed as '[ ]' (unchecked) and 'Pending' in traceability table"
    missing:
      - "Mark AUDIT-04 and AUDIT-05 as '[x]' in REQUIREMENTS.md and update traceability table to 'Complete'."
human_verification: []
---

# Phase 2: Excel Workbook Audit Verification Report

**Phase Goal:** All formulas, data tables, and domain knowledge are extracted from the Excel workbook into machine-readable artifacts
**Verified:** 2026-03-26T14:30:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | EN 15459 JSON contains HVAC components with lifespan and maintenance % fields | VERIFIED | `scripts/output/en15459.json` count=79, fields: index, name, lifespan_min/max/avg, maintenance_pct_min/max/avg. First="Air conditioning units", Last="Wiring". All assertions pass. |
| 2 | EN 15459 count meets roadmap criterion of "80+" | FAILED | Artifact has 79 components. ROADMAP success criterion states "80+". Plan must_have says "79 components". The value 79 is internally consistent and passes all script assertions, but does not satisfy the roadmap criterion. |
| 3 | Energy source list has 19 entries with index, name, category fields | VERIFIED | `scripts/output/energy_sources.json` count=19, index 2="Oil", index 19="Energy produced by local wind plants", categories fuel_source/energy_carrier correct. |
| 4 | Formulas raw JSON covers all 7 sheets with formula text and cached values | VERIFIED | `scripts/output/formulas_raw.json` total_formulas=23,668, sheets=["Project Information","WLC","Construction cost","Maintenance","Results","Calc","Charts"]. Calc=6,274, Results=900. Both exceed plan thresholds (>200, >100). |
| 5 | Formula map documents 35+ formula IDs with mathematical notation and cell references | VERIFIED | `docs/formula-map.md` contains all 39 IDs (FIN-001/002, NRG-001..007, MNT-001..004, CAL-001..008, AGG-001..014, RES-001, INC-001..003). Cell references cross-referenced against formulas_raw.json per document footer. |
| 6 | All 4 confirmed bugs documented with cell references and impact | VERIFIED | MNT-BUG-001 (Maintenance!I62 exponent), NRG-BUG-001 (PI!$D$166 vs $D$169), NRG-BUG-002 (V2 uses $L$ instead of $R$), MNT-BUG-002 (Calc!D123 BF65 vs DC65) -- all present with formula text, scope, and engine handling notes. |
| 7 | Architecture decisions DEC-001 through DEC-010 documented with workbook evidence | VERIFIED | `docs/architecture-decisions.md` contains all 10 ADRs in ADR format (Status, Context, Decision, Rationale, Consequences). Each cites cell references (e.g., Maintenance!D5, Calc!D8, Results!B62). |
| 8 | Requirements AUDIT-01 through AUDIT-05 marked complete in REQUIREMENTS.md | FAILED | AUDIT-01, AUDIT-02, AUDIT-03 are marked `[x]` and "Complete". AUDIT-04 and AUDIT-05 remain `[ ]` and "Pending" despite both being satisfied by delivered artifacts. |

**Score:** 6/8 truths fully verified (2 gaps)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/audit/extract_en15459.py` | EN 15459 extraction from Calc!B405:H483 | VERIFIED | Substantive: openpyxl load, rows 405-483, columns B-H, assertion block, metadata envelope, pathlib. Wired: produces en15459.json. |
| `scripts/audit/extract_energy_sources.py` | Energy source extraction from PI rows 131-149 | VERIFIED | Substantive: openpyxl load, rows 131-149, column C, category logic, is_header flag, assertion block. Wired: produces energy_sources.json. |
| `scripts/audit/extract_formulas.py` | Dual-pass formula extraction from all 7 sheets | VERIFIED | Substantive: dual-pass (data_only=False + True), iterates all 7 sheets, custom FormulaEncoder for datetime, assertion block. Wired: produces formulas_raw.json. |
| `scripts/output/en15459.json` | 79 HVAC components with lifespan and maintenance data | VERIFIED (count gap) | count=79, all fields present, assertions confirmed via direct JSON read. Count is 79, not 80+ as roadmap states. |
| `scripts/output/energy_sources.json` | 19 energy sources with index and category | VERIFIED | count=19, correct boundary values, all fields present. |
| `scripts/output/formulas_raw.json` | Raw formula dump from all 7 sheets | VERIFIED | total_formulas=23,668, 7 sheets, formula text + cached_value per cell. |
| `docs/formula-map.md` | 39 formula IDs with cell refs, math notation, classification | VERIFIED | All 39 IDs present. Contains Variant Column Mapping, Known Bugs (4), Open Questions (3), cross-reference note citing formulas_raw.json. |
| `docs/architecture-decisions.md` | DEC-001 through DEC-010 as ADRs | VERIFIED | All 10 decisions present. ADR structure: Status, Context, Decision, Rationale, Consequences. Cell evidence cited throughout. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/audit/extract_en15459.py` | `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` | openpyxl data_only=True, Calc!B405:H483 | WIRED | Script opens workbook, accesses "Calc" sheet, iterates rows 405-483 columns B-H. Output confirmed in en15459.json. |
| `scripts/audit/extract_energy_sources.py` | `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` | openpyxl data_only=True, PI rows 131-149 | WIRED | Script opens "Project Information" sheet, iterates rows 131-149, column C. Output confirmed in energy_sources.json. |
| `scripts/audit/extract_formulas.py` | `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` | openpyxl dual-pass (data_only=False + True) | WIRED | Two workbook loads, iterates all 7 named sheets, checks `startswith("=")`. 23,668 formulas confirmed in output. |
| `docs/formula-map.md` | `scripts/output/formulas_raw.json` | Cell references cross-referenced | WIRED | Document footer states "All formula cell references in this document have been verified against scripts/output/formulas_raw.json (23,668 extracted cells)." Cell refs (e.g., Calc!D8, Maintenance!I62) match patterns in formulas_raw.json structure. |
| `docs/formula-map.md` | `llc-implementation-plan.md` | Formula IDs sourced from implementation plan table | WIRED | FIN-001, NRG-001, MNT-001 and all module IDs present. Fisher equation notation and module structure match plan. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUDIT-01 | 02-01 | All Excel formulas extracted programmatically (7 sheets) | SATISFIED | formulas_raw.json: 23,668 formulas, 7 sheets, formula text + cached values. |
| AUDIT-02 | 02-01 | EN 15459 lookup table extracted (80+ components) | PARTIAL | en15459.json has 79 components. Workbook range B405:H483 yields exactly 79 non-null rows. Roadmap says "80+" but plan must_have says "79". |
| AUDIT-03 | 02-01 | Energy source list extracted from Project Information sheet | SATISFIED | energy_sources.json: 19 entries, fuel_source + energy_carrier categories, correct boundary values. |
| AUDIT-04 | 02-02 | Formula map with 35+ formula IDs | SATISFIED | docs/formula-map.md: 39 IDs across 7 modules, cell refs, math notation, classification, variant mapping, bugs. |
| AUDIT-05 | 02-02 | Architecture decisions DEC-001 through DEC-010 | SATISFIED | docs/architecture-decisions.md: 10 ADRs with workbook cell evidence, formula mode, METHOD_IMPROVEMENT classification. |

**Note -- REQUIREMENTS.md tracking lag:** AUDIT-04 and AUDIT-05 are satisfied by delivered artifacts but still show `[ ]` and "Pending" in `.planning/REQUIREMENTS.md`. This is a bookkeeping gap, not an implementation gap.

**Note -- AUDIT-02 count discrepancy:** The roadmap success criterion states "80+ HVAC components". The actual workbook has 79 non-null rows in Calc!B405:H483. The plan itself specifies "exactly 79 components" and all script assertions enforce this. Either the roadmap criterion was written with a rounding estimate, or one component row is null/sentinel in the workbook. The extracted data is correct at 79.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None found | -- | -- | All scripts are substantive implementations with assertion-based validation, metadata envelopes, and real workbook reads. No stubs, placeholders, or TODO comments detected. |

---

### Human Verification Required

None. All artifacts are documentation/data files (JSON, Markdown). The content can be verified programmatically against the source JSON outputs and the Excel workbook range specifications.

---

## Gaps Summary

Two gaps identified:

**Gap 1 -- EN 15459 count vs roadmap criterion (PARTIAL, low severity):**
The JSON artifact delivers 79 components. The ROADMAP success criterion says "80+". The plan's own must_have specifies "79 components". The workbook range B405:H483 is 79 rows wide when null rows are filtered. This is most likely a roadmap criterion that was written as an estimate ("80+") before the exact count was known. The actual extraction is correct and internally consistent. Resolution: update the roadmap success criterion for AUDIT-02 from "80+" to "79" to match reality, or verify the workbook has an 80th component in a null row.

**Gap 2 -- REQUIREMENTS.md not updated after Plan 02-02 (FAILED, low severity):**
AUDIT-04 and AUDIT-05 are implemented and their artifacts are verified. The requirements file still shows them as incomplete. This is a bookkeeping oversight. Resolution: mark both as `[x]` Complete in REQUIREMENTS.md.

Neither gap affects Phase 3 readiness. The JSON artifacts and documentation are complete and accurate for consumption by Phase 3 (Schema & Types) and Phase 4 (Calculation Engine).

---

_Verified: 2026-03-26T14:30:00Z_
_Verifier: Claude (gsd-verifier)_

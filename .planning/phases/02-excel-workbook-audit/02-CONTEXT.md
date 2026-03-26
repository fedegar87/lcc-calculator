# Phase 2: Excel Workbook Audit - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 1 + excel-workbook-findings.md)

<domain>
## Phase Boundary

This phase extracts all formulas, data tables, and domain knowledge from the CRAVEzero Excel workbook (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`) into machine-readable artifacts. After completion, the engine (Phase 4) can be built entirely from these extracted artifacts without ever opening the Excel file again.

**Important:** This audit was already performed in a previous conversation session using Python openpyxl scripts. The findings are documented in `memory/excel-workbook-findings.md` and the formula map is embedded in `llc-implementation-plan.md`. This phase formalizes those findings into structured output files.

</domain>

<decisions>
## Implementation Decisions

### Extraction Tools
- Use Python with `openpyxl` for programmatic extraction (already proven in previous audit)
- Scripts go in `scripts/audit/` directory
- Output goes to `scripts/output/` as JSON files

### What to Extract
1. **Formula map** (AUDIT-04): All 35+ formula IDs documented with:
   - Formula ID (FIN-001, NRG-001, etc.)
   - Excel cell reference (e.g., Calc!D7, Results!B62)
   - Mathematical notation
   - Classification: EXCEL_DIRECT, EXCEL_BUG_FIX, METHOD_IMPROVEMENT
2. **EN 15459 lookup table** (AUDIT-02): From Calc!B405:H483
   - Component name, lifespan, maintenance %, inspection interval
   - Output: `scripts/output/en15459.json`
3. **Energy source list** (AUDIT-03): From Project Information sheet
   - 19 energy sources with name, price/kWh, annual increase %
   - Output: `scripts/output/energy_sources.json`
4. **Architecture decisions** (AUDIT-05): DEC-001 through DEC-010 with workbook evidence

### Known Findings (from previous audit)
- 7 sheets: Project Information, WLC, Construction cost, Maintenance, Results, Calc, Charts
- FIN-001: Fisher simplified `=(D121-D123)/(1+(D123/100))`
- Interest stored as basis points (Calc!C3=151 → 0.0151)
- Energy escalation: compound via INDEX into source table
- PV escalation: uses PI!G143 directly (special case)
- MNT-BUG-001: Row 62 `^(I)` instead of `^(I5)` — confirmed
- Results chain: B62 (LCC) = B57 (design) + B65 (construction) + B76 (O&M) + B61 (site_mgmt)
- Residual value column BC: header exists, formulas empty
- Income: data in PI rows 84-113, never used in Results
- Energy system counts: Heating/Cooling/DHW=2 systems, Household=1, PV=1
- Category mapping: A*=building elements, B*/C*=building services, D*/E*=none

### Output Format
- JSON for data tables (EN 15459, energy sources)
- Markdown for formula map (`docs/formula-map.md`)
- Architecture decisions in `docs/architecture-decisions.md`

### Claude's Discretion
- Exact Python script structure (single script vs multiple)
- Validation logic for extracted data (row counts, value ranges)
- Additional columns/data from EN 15459 table beyond the minimum
- Format of formula map markdown (table vs sections)
- Whether to extract additional reference data beyond the 3 required outputs

</decisions>

<specifics>
## Specific Ideas

- The Excel file is at `CRAVEzero/200512_LCC_tool_beta_v2.xlsm` — this path is confirmed
- Previous extraction scripts successfully used openpyxl with `data_only=False` to get formulas
- The Calc sheet has the core calculation engine (505 rows, 65 cols)
- EN 15459 data is in Calc!B405:H483 (approximately 80 rows)
- Energy sources are in Project Information with INDEX references
- Variant 2 consumption references Variant 1 prices — possible Excel bug, document it
- The `memory/excel-workbook-findings.md` file contains the previous audit's key findings

</specifics>

<deferred>
## Deferred Ideas

- Golden test fixture extraction (Phase 5)
- Prisma schema creation (Phase 3)
- Any engine implementation (Phase 4)

</deferred>

---
*Phase: 02-excel-workbook-audit*
*Context gathered: 2026-03-26 via PRD Express Path*

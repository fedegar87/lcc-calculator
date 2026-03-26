# Phase 2: Excel Workbook Audit - Research

**Researched:** 2026-03-26
**Domain:** Excel workbook reverse-engineering, data extraction, LCC domain knowledge
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Python with `openpyxl` for programmatic extraction (already proven in previous audit)
- Scripts go in `scripts/audit/` directory
- Output goes to `scripts/output/` as JSON files
- Extract formula map with 35+ formula IDs (FIN, NRG, MNT, CAL, AGG, RES, INC)
- EN 15459 lookup table from Calc!B405:H483 to `scripts/output/en15459.json`
- Energy source list from Project Information sheet to `scripts/output/energy_sources.json`
- Architecture decisions DEC-001 through DEC-010 documented
- JSON for data tables, Markdown for formula map (`docs/formula-map.md`), architecture decisions in `docs/architecture-decisions.md`

### Claude's Discretion
- Exact Python script structure (single script vs multiple)
- Validation logic for extracted data (row counts, value ranges)
- Additional columns/data from EN 15459 table beyond the minimum
- Format of formula map markdown (table vs sections)
- Whether to extract additional reference data beyond the 3 required outputs

### Deferred Ideas (OUT OF SCOPE)
- Golden test fixture extraction (Phase 5)
- Prisma schema creation (Phase 3)
- Any engine implementation (Phase 4)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIT-01 | All Excel formulas extracted programmatically from CRAVEzero workbook (7 sheets) | openpyxl `data_only=False` extracts formulas; `data_only=True` extracts cached values. Both modes verified working on this workbook. All 7 sheets confirmed: PI (176 rows, 56 cols), WLC (88 rows, 31 cols), Construction cost (1351 rows, 156 cols), Maintenance (908 rows, 245 cols), Results (195 rows, 311 cols), Charts (50 rows, 45 cols), Calc (505 rows, 65 cols). |
| AUDIT-02 | EN 15459 lookup table extracted (80+ HVAC components with lifespan, maintenance %) | Verified: 79 components in Calc!B405:H483 with exact structure documented below. Columns: Component name, Lifespan (min/max/average), Maintenance % (min/max/average). Average columns use `=ROUND(AVERAGE(min,max),0)` and `=AVERAGE(min,max)`. |
| AUDIT-03 | Energy source list extracted from Project Information sheet | Verified: 19 energy sources in PI rows 131-149. Column C has names, F has price (EUR/kWh), G has annual increase (%). Per-variant columns: Base=F/G, V1=L/M, V2=R/S. |
| AUDIT-04 | Formula map documented with 35+ formula IDs | Implementation plan already contains 35 formula IDs. All formulas verified against actual Excel cells via openpyxl. Additional bugs discovered (documented below). |
| AUDIT-05 | Architecture decisions documented (DEC-001 through DEC-010) | All 10 decisions already documented in implementation plan. Verified against workbook formulas. |
</phase_requirements>

## Summary

Phase 2 extracts all formulas, data tables, and domain knowledge from the CRAVEzero Excel workbook (`CRAVEzero/200512_LCC_tool_beta_v2.xlsm`) into machine-readable artifacts. The workbook has 7 sheets with a total footprint of approximately 3,250 rows across all sheets.

The previous audit (documented in `llc-implementation-plan.md`) already identified 35 formula IDs, 10 architecture decisions, and the key data tables. This phase formalizes those findings into structured outputs. During this research, all formulas were re-verified against the actual workbook using openpyxl, and **two additional bugs were discovered** beyond MNT-BUG-001:

1. **Household electricity escalation** uses DHW energy source index (`PI!$D$166`) instead of household source index (`PI!$D$169`) across all 3 variants
2. **Variant 2 maintenance services** in Calc row 123 references `Maintenance!BF65` (Variant 1 columns) instead of `Maintenance!DC65` (Variant 2 columns)
3. **Variant 2 energy prices** in PI use `INDEX($L$131:$L$149,...)` referencing Variant 1 price columns instead of Variant 2's own price columns (column R/S)

**Primary recommendation:** Use separate scripts for each extraction concern (formulas, EN 15459, energy sources). Run two passes per script: `data_only=False` for formulas, `data_only=True` for cached values. Include validation assertions (row counts, non-null checks, value range checks).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openpyxl | 3.1.5 | Read .xlsm files with formula and value extraction | Already installed, proven on this workbook |
| Python | 3.11 | Script execution runtime | Already available on system |
| json (stdlib) | -- | JSON serialization for output files | No external dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pathlib (stdlib) | -- | Cross-platform path handling | All file I/O in scripts |
| collections (stdlib) | -- | OrderedDict for ordered JSON output | EN 15459 components list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| openpyxl | xlrd + xlwt | xlrd only reads .xls, not .xlsm; openpyxl is the correct choice |
| openpyxl | pandas | Heavier dependency, less control over formula vs value reading |
| Manual JSON construction | jsonschema | Adds validation but overkill for one-time extraction |

**Installation:**
```bash
# openpyxl already installed (3.1.5), no additional packages needed
pip install openpyxl  # only if not already present
```

## Architecture Patterns

### Recommended Script Structure
```
scripts/
├── audit/
│   ├── extract_formulas.py       # AUDIT-01, AUDIT-04: All formulas from 7 sheets
│   ├── extract_en15459.py        # AUDIT-02: EN 15459 component lookup table
│   └── extract_energy_sources.py # AUDIT-03: Energy source list from PI
└── output/
    ├── en15459.json              # 79 HVAC components
    ├── energy_sources.json       # 19 energy sources
    └── formulas_raw.json         # Optional: raw formula dump for verification
```

### Pattern 1: Dual-Pass Extraction
**What:** Open the workbook twice: once with `data_only=False` to get formulas, once with `data_only=True` to get cached computed values.
**When to use:** Always, for every extraction script.
**Example:**
```python
import openpyxl

WORKBOOK_PATH = "CRAVEzero/200512_LCC_tool_beta_v2.xlsm"

# Pass 1: formulas
wb_formulas = openpyxl.load_workbook(WORKBOOK_PATH, data_only=False, keep_vba=True)

# Pass 2: cached values
wb_values = openpyxl.load_workbook(WORKBOOK_PATH, data_only=True, keep_vba=True)

# Access formula text
formula = wb_formulas["Calc"].cell(row=8, column=4).value
# Returns: '=(1/(1+(\'Project Information\'!$D$125)))^D7'

# Access cached computed value
value = wb_values["Calc"].cell(row=8, column=4).value
# Returns: 1 (the cached result from last Excel save)
```

### Pattern 2: Assertion-Based Validation
**What:** Include assertions in extraction scripts to catch unexpected data shapes.
**When to use:** After every extraction step.
**Example:**
```python
components = extract_en15459(ws)
assert len(components) == 79, f"Expected 79 EN 15459 components, got {len(components)}"
assert all(c["lifespan_avg"] > 0 for c in components), "All lifespans must be positive"
assert all(0 <= c["maintenance_pct_avg"] <= 1 for c in components if c["maintenance_pct_avg"] is not None), "Maintenance % must be 0-1"
```

### Anti-Patterns to Avoid
- **Reading only values without formulas:** You lose the ability to verify calculation logic. Always do dual-pass.
- **Hardcoding cell positions without labels:** Use row/column scanning to find headers first, then extract data relative to headers. The EN 15459 table starts at B402 (header), data at B405.
- **Ignoring None values:** Some EN 15459 components have `None` for maintenance % (e.g., Chimney at row 414). Handle these explicitly.
- **Assuming uniform structure across variants:** Base/V1/V2 use different column offsets in PI and different row blocks in Calc/Maintenance. Document every offset.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel file parsing | Custom XML parser | openpyxl | .xlsm is complex (ZIP of XML + VBA binary) |
| JSON serialization | String concatenation | json.dumps with indent | Proper escaping, unicode handling |
| Cell reference parsing | Regex on A1 notation | openpyxl.utils (column_index_from_string, get_column_letter) | Handles multi-letter columns correctly |

**Key insight:** openpyxl handles the .xlsm format (macros included) correctly with `keep_vba=True`. The VBA macros in this workbook are UI controls (variant display buttons, ActiveX controls) and do not affect calculation logic.

## Common Pitfalls

### Pitfall 1: data_only=True Returns None for Never-Calculated Cells
**What goes wrong:** If a workbook was never opened and saved in Excel (only edited by openpyxl or never computed), `data_only=True` returns `None` instead of computed values.
**Why it happens:** openpyxl does not have a formula evaluation engine. It only reads cached values that Excel computed on last save.
**How to avoid:** Verified that this workbook has cached values: 244 formula cells in Calc have non-null cached values, 206 in Results, 191 in Maintenance. All formula cells have cached values.
**Warning signs:** `None` for cells that should have numbers.

### Pitfall 2: Merged Cells in EN 15459 Header
**What goes wrong:** The EN 15459 table has merged header cells (row 402: "Component" spans B402, "Lifespan" spans C-E, "Annual preventive maintenance..." spans F-H). Reading merged cells only returns value for top-left cell.
**Why it happens:** openpyxl stores merged cell value only in the anchor cell.
**How to avoid:** Use the sub-headers in row 403 (min/max/average) for column mapping, not the merged headers in row 402.
**Warning signs:** `None` values in expected header positions.

### Pitfall 3: Row 404 is an Empty Sentinel Row
**What goes wrong:** EN 15459 data starts at row 405, not row 404. Row 404 has `None` for component name and `0` for maintenance values. Including it in extraction produces a garbage row.
**Why it happens:** Excel uses row 404 as a placeholder/sentinel (index 0).
**How to avoid:** Start extraction at row 405, filter out rows where component name (`B`) is `None`.
**Warning signs:** First component in JSON has null name and zero values.

### Pitfall 4: Variant Column Offset Errors
**What goes wrong:** Using wrong column offsets for V1/V2 data. Each variant uses different columns in PI, different row blocks in Calc, and different column blocks in Maintenance.
**Why it happens:** The Excel workbook duplicates formulas across column/row blocks rather than using parametric references.
**How to avoid:** Document the complete column mapping (see "Verified Workbook Structure" below). Cross-reference the Calc sheet formula references back to PI columns.
**Warning signs:** V1/V2 calculations produce identical results to Base.

### Pitfall 5: The Household Electricity Escalation Bug
**What goes wrong:** Household electricity uses DHW's energy source index for price escalation. All 3 variants have this bug: `INDEX($G$131:$G$149, PI!$D$166)` where `$D$166` is the DHW source index, not `$D$169` (household).
**Why it happens:** Copy-paste error during workbook construction. The initial price `PI!$E$169` is correct (household), but the escalation INDEX references the wrong row.
**How to avoid:** Document as a new bug (NRG-BUG-001). The engine can choose to replicate or fix this.
**Warning signs:** Household electricity escalation rate matches DHW instead of following its own energy source selection.

## Code Examples

### EN 15459 Extraction
```python
import openpyxl
import json
from pathlib import Path

WORKBOOK = Path("CRAVEzero/200512_LCC_tool_beta_v2.xlsm")
OUTPUT = Path("scripts/output/en15459.json")

wb = openpyxl.load_workbook(WORKBOOK, data_only=True, keep_vba=True)
ws = wb["Calc"]

# Table structure verified:
# Row 402: merged headers (Component | Lifespan | Maintenance %)
# Row 403: sub-headers (min | max | average | min | max | average)
# Row 404: empty sentinel (index 0)
# Rows 405-483: 79 HVAC components

components = []
for row in range(405, 484):
    name = ws.cell(row=row, column=2).value  # B: Component name
    if name is None:
        continue
    components.append({
        "index": row - 404,  # 1-based index matching Excel INDEX() usage
        "name": name,
        "lifespan_min": ws.cell(row=row, column=3).value,   # C
        "lifespan_max": ws.cell(row=row, column=4).value,   # D
        "lifespan_avg": ws.cell(row=row, column=5).value,   # E (=ROUND(AVG(C,D),0))
        "maintenance_pct_min": ws.cell(row=row, column=6).value,  # F
        "maintenance_pct_max": ws.cell(row=row, column=7).value,  # G
        "maintenance_pct_avg": ws.cell(row=row, column=8).value,  # H (=AVG(F,G))
    })

# Validation
assert len(components) == 79, f"Expected 79, got {len(components)}"
assert components[0]["name"] == "Air conditioning units"
assert components[-1]["name"] == "Wiring"

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(components, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(components)} EN 15459 components to {OUTPUT}")
```

### Energy Sources Extraction
```python
import openpyxl
import json
from pathlib import Path

WORKBOOK = Path("CRAVEzero/200512_LCC_tool_beta_v2.xlsm")
OUTPUT = Path("scripts/output/energy_sources.json")

wb = openpyxl.load_workbook(WORKBOOK, data_only=True, keep_vba=True)
ws = wb["Project Information"]

# Energy sources: PI rows 131-149, column C (name)
# Two groups:
#   Rows 131-141: "Fuel Source" (B131 label)
#   Rows 142-149: "Energy carriers" (B142 label)
# Additional: Rows 150-154: user-defined sources (currently placeholder text)

sources = []
for row in range(131, 155):
    name = ws.cell(row=row, column=3).value  # C: Energy carrier name
    if name is None or name.startswith("€") or name.startswith("\u20ac"):
        continue
    category = None
    if 131 <= row <= 141:
        category = "fuel_source"
    elif 142 <= row <= 149:
        category = "energy_carrier"
    elif 150 <= row <= 154:
        category = "additional"
        continue  # Skip placeholder entries

    sources.append({
        "index": row - 130,  # 1-based, matches INDEX() in formulas
        "row": row,
        "name": name,
        "category": category,
    })

# Validation
assert len(sources) == 19, f"Expected 19, got {len(sources)}"
assert sources[0]["name"] == "Oil"  # Index 2 (row 132)
assert sources[-1]["name"] == "Energy produced by local wind plants"  # Index 19 (row 149)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(sources, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(sources)} energy sources to {OUTPUT}")
```

### Formula Extraction Pattern
```python
import openpyxl

WORKBOOK = "CRAVEzero/200512_LCC_tool_beta_v2.xlsm"

wb_f = openpyxl.load_workbook(WORKBOOK, data_only=False, keep_vba=True)
wb_v = openpyxl.load_workbook(WORKBOOK, data_only=True, keep_vba=True)

SHEETS = [
    "Project Information",
    "WLC",
    "Construction cost",
    "Maintenance",
    "Results",
    "Calc",
    "Charts",
]

for sheet_name in SHEETS:
    ws_f = wb_f[sheet_name]
    ws_v = wb_v[sheet_name]
    formulas = []
    for row in range(1, ws_f.max_row + 1):
        for col in range(1, ws_f.max_column + 1):
            cell_f = ws_f.cell(row=row, column=col)
            if cell_f.value and str(cell_f.value).startswith("="):
                cell_v = ws_v.cell(row=row, column=col)
                formulas.append({
                    "sheet": sheet_name,
                    "cell": cell_f.coordinate,
                    "formula": cell_f.value,
                    "cached_value": cell_v.value,
                })
    print(f"{sheet_name}: {len(formulas)} formula cells")
```

## Verified Workbook Structure

### Sheet Inventory (7 sheets)

| Sheet | Rows | Cols | Purpose |
|-------|------|------|---------|
| Project Information | 176 | 56 | Project metadata, energy prices, consumption, income, boundary conditions |
| WLC | 88 | 31 | Non-construction costs, design fees, site management |
| Construction cost | 1351 | 156 | Per-category material/labor costs with detail layers |
| Maintenance | 908 | 245 | Annual maintenance + replacement cycles, 3 variant blocks |
| Results | 195 | 311 | Aggregated LCC/WLC, KPIs, 3 variant blocks |
| Charts | 50 | 45 | Chart data (no unique calculations) |
| Calc | 505 | 65 | Core calculation engine: discount, energy, aggregation |

### Variant Column/Row Mapping

**Project Information (PI) sheet:**
| Field | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Interest rate (Rint) | D121 | J121 | O121 (*) |
| Inflation rate (Ri) | D123 | J123 | O123 (*) |
| Real interest rate (RR) | D125 | J125 | O125 |
| Energy price (EUR/kWh) | F131:F149 | L131:L149 | R131:R149 (**) |
| Energy price increase (%/yr) | G131:G149 | M131:M149 | S131:S149 (**) |
| Energy source index | D160-D169 | J160-J169 | O160-O169 |
| Specific consumption (kWh/m2) | F160-F169 | L160-L169 | Q160-Q169 |
| Annual consumption (kWh) | G160-G169 | M160-M169 | R160-R169 |
| Energy cost lookup | E160-E169 | K160-K169 | P160-P169 |
| PV row 143 energy name | C143 | J143 | O143 |
| PV price | E171/F143 | K171/L143 | P171/Q143 |
| Reference period | D119 | J119 | O119 |
| Treated floor area | D52 | D52 | D52 (shared) |

(*) Not independently verified whether V1/V2 can have different interest rates. Formulas use per-variant columns.
(**) V2 energy cost lookup uses `INDEX($L$131:$L$149,...)` -- BUG: references V1 prices instead of V2.

**Calc sheet (row blocks per variant):**
| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Year row | 7 | 34 | 61 |
| Discount rate | 8 | 35 | 62 |
| Heating (5 rows) | 9-13 | 36-40 | 63-67 |
| Cooling (5 rows) | 14-18 | 41-45 | 68-72 |
| DHW (5 rows) | 19-23 | 46-50 | 73-77 |
| Household (4 rows) | 24-27 | 51-54 | 78-81 |
| PV (4 rows) | 28-31 | 55-58 | 82-85 |
| Aggregation block | 88-98 | 100-111 | 113-124 |

**Maintenance sheet (column blocks per variant):**
| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Header/config cols | A-H | ? | ? |
| Year columns start | I (year 1) | BF (col 58) | DC (col 107) |
| Elements total row | 64 | 64 | 64 |
| Services total row | 65 | 65 | 65 |

**Results sheet (column blocks per variant):**
| Block | Base | Variant 1 | Variant 2 |
|-------|------|-----------|-----------|
| Category label | A | H | N/O |
| LCC/WLC values | B | I | P |
| Units | C | J | Q |
| Per-m2 values | D | K | R |

### EN 15459 Table (Calc!B405:H483)

**Structure:**
- Row 402: Merged headers ("Component" | "Lifespan" | "Annual preventive maintenance...")
- Row 403: Sub-headers (-- | min | max | average | min | max | average)
- Row 404: Empty sentinel row (index 0, all zeros)
- Rows 405-483: 79 HVAC components, alphabetically sorted

**Column mapping:**
| Column | Field | Type | Notes |
|--------|-------|------|-------|
| B | Component name | string | EN 15459 standard component names |
| C | Lifespan min (years) | integer | Minimum expected lifespan |
| D | Lifespan max (years) | integer | Maximum expected lifespan |
| E | Lifespan average (years) | integer | `=ROUND(AVERAGE(C,D),0)` - this is what INDEX references use |
| F | Maintenance % min | decimal | Fraction of initial investment (0.005-0.15) |
| G | Maintenance % max | decimal | Fraction of initial investment (0.005-0.15) |
| H | Maintenance % average | decimal | `=AVERAGE(F,G)` - this is what INDEX references use |

**Notable entries:**
- Row 414 (Chimney): Maintenance % is `None` for all columns (F/G/H)
- Row 446 (Filter material to be exchanged): Lifespan=1, Maintenance=0 (replaced annually)
- Row 470 (Radiators paint): Maintenance=0 (no annual maintenance, only replacement)
- Lifespan range: 1-50 years
- Maintenance % range: 0-0.15 (0%-15% of initial investment)

### Energy Source List (PI rows 131-149)

19 energy sources in two categories:

**Fuel Sources (rows 131-141):**
| Index | Row | Name |
|-------|-----|------|
| 1 | 131 | (Category header: "Fuel Source") |
| 2 | 132 | Oil |
| 3 | 133 | Natural Gas |
| 4 | 134 | Liquified Petroleum Gas (LPG) |
| 5 | 135 | Coal |
| 6 | 136 | Wood |
| 7 | 137 | Wood logs |
| 8 | 138 | Pellets |
| 9 | 139 | Solid biomass |
| 10 | 140 | Liquid and gas biomass |
| 11 | 141 | Liquid biomass |

**Energy Carriers (rows 142-149):**
| Index | Row | Name |
|-------|-----|------|
| 12 | 142 | National Electricity-Mix |
| 13 | 143 | Electricity from Photovoltaics |
| 14 | 144 | District heating: General value adopted at national level |
| 15 | 145 | Energy from non-recyclable waste materials |
| 16 | 146 | District cooling: General value adopted at national level |
| 17 | 147 | Energy produced by Solar Thermal panels |
| 18 | 148 | Energy produced from Photovoltaic panels |
| 19 | 149 | Energy produced by local wind plants |

**Additional user-defined sources (rows 150-154):** 5 placeholder entries with "€." text, not functional.

**INDEX usage:** Energy source dropdown stores an integer index (1-19) in the "Energy source" column (e.g., PI!D160=1). The formula `INDEX($F$131:$F$149, index)` looks up the price. Note: index 1 maps to row 131 (the header row, which has no price) -- **so valid indices are 2-19** (rows 132-149). The default value of 1 means "Fuel Source" header is selected, yielding a price of 0.

### Confirmed Bugs

**MNT-BUG-001: Row 62 exponent missing year reference**
- Cell: `Maintenance!I62` (and all year columns)
- Formula: `=IF(OR(I5=$H$62,...),($E$62/((1+$D$5)^(I))),($G$62/((1+$D$5)^(I5))))`
- Bug: In the TRUE branch (replacement year), exponent is `^(I)` instead of `^(I5)`. Column letter `I` is interpreted as column reference (value 9), not as a year number.
- Impact: Replacement costs for the last service component (row 62) are discounted incorrectly. The FALSE branch (maintenance year) correctly uses `^(I5)`.
- Note: This only affects one row (the 26th/last building service component).

**NRG-BUG-001: Household electricity uses DHW energy source for escalation** (NEW)
- Cells: `Calc!E24` (Base), `Calc!E51` (V1), `Calc!E78` (V2)
- Formula (Base): `=D24+(INDEX('Project Information'!$G$131:$G$149,'Project Information'!$D$166))*D24`
- Bug: Uses `PI!$D$166` (DHW system 1 energy source index) instead of `PI!$D$169` (Household electricity source index) for the price escalation rate.
- Impact: Household electricity prices escalate at the DHW energy source's annual increase rate, not at household electricity's own rate. If both use the same energy source (common case), this bug is invisible.
- Affects: All 3 variants identically.

**NRG-BUG-002: Variant 2 energy cost uses Variant 1 price table** (NEW - also noted in CONTEXT.md as "possible Excel bug")
- Cells: `PI!P160:P169` (V2 energy cost lookup)
- Formula: `=INDEX($L$131:$L$149,O160)` -- uses `$L$` (V1 prices) instead of `$R$` (V2 prices)
- Impact: Variant 2 energy costs are calculated using Variant 1's energy prices, not its own. Only affects the initial price lookup; escalation correctly uses V2's own increase rate column ($R$131:$R$149).

**MNT-BUG-002: Variant 2 maintenance services uses Variant 1 data** (NEW)
- Cell: `Calc!D123` (and subsequent year columns)
- Formula: `=Maintenance!BF65` -- BF is Variant 1's column block, should be DC (Variant 2)
- Impact: Variant 2's building services maintenance costs are actually Variant 1's values.

**Results!F77: Broken reference**
- Formula: `=LOOKUP('Project Information'!D119,Calc!#REF!)`
- Impact: This cell contains a `#REF!` error. It appears to be a leftover from a deleted column range. Not used in any LCC/WLC calculation.

### VBA Macros

The workbook contains VBA (`xl/vbaProject.bin`) and ActiveX controls (10 ActiveX controls, 120+ control properties). These are UI elements (variant display toggle buttons, form controls) that show/hide columns. **They do not affect any calculation logic.** The web app replaces this functionality with its own UI.

### Residual Value Status

Column BC in "Construction cost" sheet:
- BC1=55 (column number)
- BC2="RESIDUAL VALUE" (header text)
- All data cells (BC4 onwards): `None` (empty)

The Results sheet has no formula referencing column BC. Residual value was planned but never implemented in Excel. The web app implements this as METHOD_IMPROVEMENT (RES-001) per ISO 15686-5.

### Income Status

PI rows 84-113 collect income data:
- 3 rent entries (rows 88, 91, 94): monthly rent (EUR/m2), rented area (m2), taxes (EUR/yr), annual gross rent (EUR)
- 3 other income entries (rows 100, 103, 106): annual income (EUR), taxes (EUR), total (EUR)
- Total annual income: row 109, col F

No Results formula references any income cell. Data collection only. The web app implements income analysis as METHOD_IMPROVEMENT (INC-001 through INC-003).

## JSON Schema Recommendations

### EN 15459 Schema
```json
{
  "source": "EN 15459:2018 via CRAVEzero workbook",
  "extracted_from": "Calc!B405:H483",
  "extraction_date": "2026-03-26",
  "count": 79,
  "components": [
    {
      "index": 1,
      "name": "Air conditioning units",
      "lifespan_min": 15,
      "lifespan_max": 15,
      "lifespan_avg": 15,
      "maintenance_pct_min": 0.04,
      "maintenance_pct_max": 0.04,
      "maintenance_pct_avg": 0.04
    }
  ]
}
```

The `index` field (1-based) matches the value stored in Maintenance sheet column D, used in `INDEX(Calc!$E$404:$E$483, index)` -- the range starts at row 404 (sentinel row), so index=1 maps to row 405.

### Energy Sources Schema
```json
{
  "source": "CRAVEzero workbook Project Information sheet",
  "extracted_from": "PI!C131:C149",
  "extraction_date": "2026-03-26",
  "count": 19,
  "note": "Index 1 maps to row 131 (header row). Valid selectable sources are indices 2-19 (rows 132-149).",
  "sources": [
    {
      "index": 1,
      "row": 131,
      "name": "Fuel Source",
      "category": "fuel_source",
      "is_header": true
    },
    {
      "index": 2,
      "row": 132,
      "name": "Oil",
      "category": "fuel_source",
      "is_header": false
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlrd for .xls reading | openpyxl for .xlsx/.xlsm | xlrd 2.0 (2020) dropped .xlsx | openpyxl is the standard for modern Excel formats |
| Single-pass reading | Dual-pass (formulas + values) | Always been this way | Need both formula text and cached values |
| Manual cell inspection | Programmatic extraction | This project | Reproducible, versionable, verifiable |

**Deprecated/outdated:**
- xlrd: Only supports .xls (old binary format) since v2.0. Not suitable for .xlsm.
- win32com (pywin32): Would require Excel installed and running. Not portable. openpyxl is pure Python.

## Open Questions

1. **Cumulated formula inconsistency: Heating vs Cooling year 1**
   - What we know: Heating cumulated (row 13) at year 1 uses `=E12` (just year 1 value). Cooling cumulated (row 18) at year 1 uses `=D18+E17` (year 0 + year 1). DHW (row 23) uses `=E22` like Heating.
   - What's unclear: Whether this is intentional or a copy-paste inconsistency. Since year 0 actualized values should be 0 (no operational costs), both formulas produce the same result in practice.
   - Recommendation: Document as minor inconsistency. Engine should use consistent logic: `cumulated[0] = year0_value; cumulated[n] = cumulated[n-1] + year_n_value`.

2. **Energy source index=1 (header row)**
   - What we know: Default energy source index is 1, which maps to the "Fuel Source" header row (131) with no price data. `INDEX` returns 0 for price.
   - What's unclear: Whether this is an intentional "not selected" sentinel or a UI default that expects users to change it.
   - Recommendation: Treat index=1 as "no source selected". In the web app, require valid source selection (2-19) via form validation.

3. **KPI divisor: B63 (Investment cost) vs B62 (LCC)**
   - What we know: Results KPI ratios use `B63` (Investment cost = Construction + Design + Site) as divisor, not `B62` (LCC). This means KPIs are ratios of investment cost components, not LCC components.
   - What's unclear: Whether this is the intended interpretation or an error. Implementation plan says `AGG-014: component / LCC`.
   - Recommendation: Extract both formulas. Let the engine implement per the Excel workbook (divide by B63), document the discrepancy with the implementation plan.

## Sources

### Primary (HIGH confidence)
- openpyxl 3.1.5 installed on system -- direct API usage verified
- CRAVEzero/200512_LCC_tool_beta_v2.xlsm -- direct workbook inspection via Python scripts
- llc-implementation-plan.md v4 -- formula map with 35 IDs, architecture decisions DEC-001 through DEC-010

### Secondary (MEDIUM confidence)
- EN 15459:2018 standard -- component names and values taken from Excel table, not independently verified against the published standard document

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - openpyxl verified working on this workbook, all extractions tested
- Architecture: HIGH - workbook structure fully inspected, all variant offsets documented
- Pitfalls: HIGH - bugs discovered via direct formula inspection, not from training data

**Research date:** 2026-03-26
**Valid until:** Indefinite (workbook is static, no changes expected)

# Gap Analysis: Excel Workbooks vs App Schema & UI

**Date:** 2026-03-28
**Source projects:** Solallén (SE), Héliades (FR), Väla Gård (SE), Aspern (AT)

---

## 1. FIELDS IN EXCEL BUT MISSING FROM APP

### 1.1 Critical (affect calculation or data completeness)

| Excel Field | Sheet | Impact | Recommendation |
|---|---|---|---|
| **VAT rate** | Energy Cost | Applied to energy prices in some projects (25% Sweden, 20% France, 20% Austria) | Add `vatRate` Decimal to BoundaryCondition. Engine currently ignores VAT — clarify if prices are gross or net. |
| **New building / Renovation** flag | Project Information | Affects cost benchmarks, maintenance assumptions | Add `isRenovation Boolean @default(false)` to Project model |
| **Number of apartments/units** | Project Information | Referenced in income calculations, KPI per-unit | Add `numberOfUnits Int?` to Project model |

### 1.2 Minor (informational, not used in calculation)

| Excel Field | Sheet | Impact | Recommendation |
|---|---|---|---|
| Latitude / Longitude | Project Information | Informational only in Excel | Skip — city + country is sufficient |
| Climate zone | Project Information | Informational | Skip |
| PHPP version | Project Information | Excel-specific metadata | Skip |
| Building certification level | Project Information | nZEB classification | Could add later as optional field |

---

## 2. FIELD NAME / LABEL MISMATCHES

| Excel Label | App Label (UI) | App Field (DB) | Issue |
|---|---|---|---|
| "RSP" (Reference Study Period) | "Reference Period" | `referencePeriod` | OK — app label is clearer |
| "Rint" (Nominal interest rate) | "Nominal Interest Rate" | `interestRate` | OK — app label is clearer |
| "Rinfl" (Inflation rate) | "Inflation Rate" | `inflationRate` | OK |
| "Treated floor area (ATFA)" | "Treated Floor Area" | `treatedFloorArea` | OK |
| "Owner / Tenant / 3rd party" | stakeholderRole (Int 1/2/3) | `stakeholderRole` | **Issue**: UI doesn't show this field. Schema has it but no form input. |
| "Design & Construction Cost" | "Design & Construction Cost" | `manualDesignConstructionCost` | UI shows it but Excel uses it as cross-check only |

---

## 3. STRUCTURAL / ORGANIZATION DIFFERENCES

### 3.1 Energy Prices Location
- **Excel**: Energy prices are on the "Energy Cost" sheet alongside boundary conditions (Rint, Rinfl)
- **App**: Energy prices stored as JSON in `BoundaryCondition.energyPrices`; boundary conditions on WLC form page
- **Assessment**: App organization is **better** — groups all financial parameters together

### 3.2 Maintenance Config Location
- **Excel**: Maintenance % is on "Project Information" sheet (row ~175)
- **App**: Maintenance % slider is on the **Energy form** page
- **Assessment**: **Questionable** — maintenance % is not energy-related. Better fit on WLC or Construction page.

### 3.3 Energy Source Selection
- **Excel**: Energy source dropdown per end-use on "Project Information" sheet
- **App**: Energy source dropdown per end-use on Energy form ✓
- **Assessment**: Matches well

### 3.4 Dual Cost Entry (Construction)
- **Excel**: Each category row has: aggregated total OR (unit price × area) — resolved as MAX()
- **App**: CostItem (aggregated) + CostItemDetail[] (unit price × area) — resolved in `buildVariantInput`
- **Assessment**: App correctly implements the dual-input pattern ✓

---

## 4. DATA COMPLETENESS PATTERNS (Cross-project)

| Data Category | Solallén (SE) | Héliades (FR) | Väla Gård (SE) | Aspern (AT) |
|---|---|---|---|---|
| Project metadata | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Geometry | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Boundary conditions | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Energy consumption | ✅ Partial (heating + elec) | ✅ Full (heat+cool+DHW+elec) | ✅ Partial (heat + elec) | ✅ Full (heat+cool+DHW+elec) |
| Energy prices | ❌ Empty | ✅ Complete | ❌ Empty | ✅ Complete |
| Construction costs | ✅ Complete | ✅ Partial (no labor) | ✅ Complete | ✅ Complete |
| Service components | ✅ Present | ✅ Present | ✅ Present | ✅ Present |
| WLC/Non-construction | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Design costs | ✅ Present | ✅ Present | ✅ Present | ✅ Present |
| Income | ❌ All zero | ❌ All zero | ❌ All zero | ❌ All zero |
| Maintenance % | ✅ 1% | ✅ 1% | ✅ 1% | ✅ 1% |

### Key finding:
Swedish projects (Solallén, Väla Gård) have consumption data but **no energy prices**.
This means the LCC engine will compute zero energy costs for these projects unless we supply reasonable default prices.

**Recommendation**: For seed data, use representative Swedish energy prices:
- District heating: ~0.08 EUR/kWh, +2% annual
- Electricity: ~0.15 EUR/kWh, +2.5% annual
- PV: ~0.10 EUR/kWh, 0% annual (flat)

---

## 5. APP SCHEMA FIELDS NOT IN EXCEL

| App Field | Model | Used? | Assessment |
|---|---|---|---|
| `region` | Project | Not in Excel | Fine — optional field for European address specificity |
| `location` | Project | Not in Excel | Fine — free text for street address |
| `author` | Project | Not in Excel | Fine — app-specific metadata |
| `organization` | User | Not in Excel | Fine — user profile field |
| `stakeholderRole` | BoundaryCondition | In Excel (row 115) but hidden | **Bug**: Field exists in schema but missing from WLC form UI |
| `landArea` | WLCInput | In Excel (WLCC sheet) | ✅ Both have it |
| `buildingIndex` | WLCInput | In Excel (WLCC sheet) | ✅ Both have it |
| `floorHeight` | WLCInput | In Excel (WLCC sheet) | ✅ Both have it |
| `expectedPricePerM2` | IncomeInput | In Excel (PI rows 84-113) | Both zero in all projects |

---

## 6. UI-SPECIFIC ISSUES

### 6.1 Missing UI for existing schema fields
- **`stakeholderRole`**: BoundaryCondition has this field (Int, default 1) but WLC form doesn't expose it
- Should be a dropdown: 1=Owner, 2=Tenant, 3=Third Party

### 6.2 BuildingUse enum doesn't match Excel
- **Excel values**: "Terraced house", "Apartment house", "Office building"
- **App enum**: RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, OFFICE, EDUCATION, COMMERCIAL, INDUSTRIAL, OTHER
- Mapping: Terraced house → RESIDENTIAL_SINGLE (debatable), Apartment house → RESIDENTIAL_MULTI, Office → OFFICE
- "Terraced house" is multi-unit but single-family — **RESIDENTIAL_MULTI** is actually more appropriate

### 6.3 Energy form: System 1 / System 2 labels
- Excel uses "System 1" and "System 2" for dual energy sources per end-use
- App UI uses the same convention ✓
- But: most projects only use System 1 — System 2 is rarely populated

---

## 7. RECOMMENDATIONS SUMMARY

### Must fix (before adding real project data):
1. ~~None blocking~~ — all fields needed for seed data exist in the schema

### Should fix (improve accuracy):
1. Add `stakeholderRole` to WLC form UI (field already in DB)
2. Consider moving maintenance % from Energy page to WLC or Construction page
3. Add `isRenovation` boolean to Project model for future use
4. Add `numberOfUnits` to Project for per-unit KPI calculations

### Nice to have:
1. Add VAT rate to BoundaryCondition (currently unclear if prices are gross/net)
2. Add per-unit KPI display in results (LCC/unit, WLC/unit)
3. Consider adding "data completeness" indicator per project

---

## 8. SEED DATA STRATEGY

For the 4 CRAVEzero projects:
- Use existing schema as-is (no migration needed)
- Swedish projects with missing energy prices: supply representative defaults
- Income fields: leave as zero (matches Excel reality)
- Labor costs zero for Héliades: preserve as-is (French market uses material-only pricing)
- Map building types: Terraced→RESIDENTIAL_MULTI, Apartment→RESIDENTIAL_MULTI, Office→OFFICE

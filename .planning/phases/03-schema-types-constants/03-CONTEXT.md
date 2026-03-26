# Phase 3: Schema, Types & Constants - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 2 + TASK 3)

<domain>
## Phase Boundary

This phase creates the data layer and type system: Prisma schema for persistence, engine TypeScript types for calculation, EN 15459 constants from the audit output, and input validation rules. After completion, the engine (Phase 4) can be implemented against these types, and the API (Phase 7) can read/write using this schema. No business logic, no API routes, no UI.

</domain>

<decisions>
## Implementation Decisions

### Prisma Schema (DATA-01 through DATA-06)
- Use Prisma 7 with `prisma-client` generator (set up in Phase 1)
- All monetary values use `Decimal` type
- All rates use `Decimal` type
- Models required (from implementation plan TASK 2):
  - User (id, name, email, passwordHash, organization)
  - Project (id, name, location, buildingUse, constructionYear, notes, variants, members)
  - ProjectMember (userId, projectId, role: OWNER/EDITOR/VIEWER)
  - Variant with VariantLabel enum (BASE, VARIANT_1, VARIANT_2)
  - Geometry (20+ fields: GFA, NFA, treated floor area, building height, U-values, etc.)
  - BoundaryCondition (interestRate, inflationRate, referencePeriod, energyPrices as JSON)
  - CostCategory enum (A1_ROOFS through E1_OUTDOOR, 21 values)
  - CostItem (variantId, category, materialCost, laborCost, otherCost)
  - CostItemDetail (costItemId, description, area, unitPrice, materialCost, laborCost)
  - EnergyInput with EndUse enum (HEATING_1, HEATING_2, COOLING_1, COOLING_2, DHW_1, DHW_2, HOUSEHOLD_ELECTRICITY, PV_PRODUCTION)
  - ServiceComponent (variantId, name, constructionCost, en15459ComponentIndex, lifespan, maintenancePercent)
  - WLCInput (landCost, enablingCosts, planningFees, userSupportPropMgmt, userSupportCharges, userSupportAdmin, financeCost)
  - DesignCost (variantId, lineNumber, description, preliminaryCost, definitiveCost, executiveCost, siteManagementCost)
  - IncomeInput (rents as JSON, otherIncomes as JSON, expectedPricePerM2)
  - MaintenanceConfig (buildingElementMaintenancePercent)
  - FormulaMode enum (EXCEL_REPLICA, EXCEL_BUGFIXED)
  - ResultSnapshot (projectId, variantLabel, engineVersion, formulaMode, inputs JSON, inputsHash, outputs JSON, trigger)
  - ProjectRevision (projectId, label, note, snapshotIds)
  - ExportRecord (projectId, format, snapshotId, fileUrl, fileName)
- All relations use `onDelete: Cascade` from Project
- Indexes on projectId for all project-related models

### Engine Types (DATA-07)
- Pure TypeScript interfaces in `src/engine/types.ts` — NO Prisma imports
- FormulaMode as string literal union: `'excel_replica' | 'excel_bugfixed'`
- ENGINE_VERSION constant
- EngineConfig, VariantInput, LCCResult, YearlyEnergyCosts interfaces
- Category-to-maintenance mapping: CATEGORY_MAINTENANCE_MAP constant
- Energy system configuration: END_USE_PAIRS constant
- Input types: EnergySourcePrice, EnergyEndUseInput, ServiceComponentInput, CostItemInput, DesignCostInput, IncomeInputData, WLCInputData
- See implementation plan section 3.1 for full interface definitions

### EN 15459 Constants (DATA-08)
- Source: `scripts/output/en15459.json` (extracted in Phase 2)
- Target: `src/engine/constants.ts`
- Must include: component name, lifespan (min/max/avg), maintenance % (min/max/avg)
- Energy sources from `scripts/output/energy_sources.json`
- Use exact values from audit, do NOT type manually

### Input Validation (DATA-09)
- `src/engine/validation.ts` with `validateVariantInput()` function
- Returns string[] of error messages (empty = valid)
- Rules: referencePeriod > 0 and <= 100, interest/inflation rates in [-0.1, 0.5], treatedFloorArea >= 0, energy source indexes 1-19, costs >= 0

### Claude's Discretion
- Exact Prisma field names (snake_case vs camelCase — Prisma convention)
- Whether to split schema into multiple files or single `schema.prisma`
- JSON field structure for BoundaryCondition.energyPrices
- Whether to use Prisma 7 composite types or JSON for nested data
- Validation error message wording
- Additional helper types for internal engine use

</decisions>

<specifics>
## Specific Ideas

- The implementation plan has complete interface definitions in section 3.1 — use those as source of truth
- CATEGORY_MAINTENANCE_MAP maps A* to 'building_element', B*/C* to 'building_service', D*/E* to 'none'
- END_USE_PAIRS: [['HEATING_1','HEATING_2'], ['COOLING_1','COOLING_2'], ['DHW_1','DHW_2'], ['HOUSEHOLD_ELECTRICITY', null]]
- PV_PRODUCTION handled separately (subtracted, not added)
- FormulaMode enum in Prisma is SCREAMING_CASE, in engine is lowercase — tRPC converts (implementation rule 13)
- Engine receives pre-aggregated costs — detail MAX logic in tRPC layer (implementation rule 12)
- designCostsTotal and siteManagementCostsTotal are SEPARATE in WLCInputData
- Prisma 7 uses `prisma-client` provider, NOT `prisma-client-js`
- Prisma 7 requires `output` field and driver adapter (already configured in Phase 1)

</specifics>

<deferred>
## Deferred Ideas

- Engine implementation (Phase 4)
- Engine tests (Phase 5)
- Database seed (Phase 6)
- tRPC routers that use these types (Phase 7)

</deferred>

---
*Phase: 03-schema-types-constants*
*Context gathered: 2026-03-26 via PRD Express Path*

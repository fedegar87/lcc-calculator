# Phase 16: Gap Analysis Fixes - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Source:** Gap analysis from Excel workbook audit (02-02-GAP-ANALYSIS.md)

<domain>
## Phase Boundary

Close two confirmed UX gaps found during the CRAVEzero Excel workbook audit:
1. stakeholderRole field exists in DB but has no UI control
2. MaintenanceConfig section is on the Energy form but logically belongs on Construction

No schema migrations. No engine changes. Pure UI reorganization.

</domain>

<decisions>
## Implementation Decisions

### Fix 1: stakeholderRole Dropdown
- Add a Select component to BoundaryConditionSection in wlc-form.tsx
- Options: 1 = Owner, 2 = Tenant, 3 = Third Party (matches Excel values)
- The tRPC router `upsertBoundaryCondition` already accepts `stakeholderRole: z.number().int().optional()`
- The Zod schema `boundarySchema` already has `stakeholderRole: z.number().int().optional().nullable()`
- Default form value already reads from `bc?.stakeholderRole`
- The `onSave` callback already passes `stakeholderRole: values.stakeholderRole ?? undefined`
- Only missing piece: the JSX render in BoundaryConditionSection

### Fix 2: Move MaintenanceConfig to Construction Form
- Remove `<MaintenanceConfigSection>` from energy-form.tsx
- Move the `MaintenanceConfigSection` function + its schema/types to construction-form.tsx
- The tRPC mutation `upsertMaintenanceConfig` is on the variant router — works from any page
- construction-form.tsx already fetches `variant` via `trpc.variant.getById` — MaintenanceConfig data is available
- Add the section after the last category group in ConstructionForm's return JSX

### Claude's Discretion
- Exact placement of stakeholderRole within the boundary conditions grid
- Import organization in construction-form.tsx after adding maintenance dependencies

</decisions>

<specifics>
## Specific References

- wlc-form.tsx:130-198 — BoundaryConditionSection (add Select here)
- energy-form.tsx:335-398 — MaintenanceConfigSection (move this)
- energy-form.tsx:70-74 — maintenanceSchema (move this)
- energy-form.tsx:112 — Remove `<MaintenanceConfigSection>` from JSX
- construction-form.tsx:600-647 — ConstructionForm return (add maintenance here)
- variant.ts:321-325 — upsertBoundaryCondition already handles stakeholderRole
- variant.ts:527 — upsertMaintenanceConfig already exists

</specifics>

<deferred>
## Deferred Ideas

- vatRate field (needs engine changes first)
- isRenovation boolean (informational only, no engine impact)
- numberOfUnits (needs per-unit KPI implementation)

</deferred>

---

*Phase: 16-gap-analysis-fixes*
*Context gathered: 2026-03-28 from Excel workbook audit*

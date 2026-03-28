# Phase 10: Variant Creation UI - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the existing `addVariant` tRPC procedure to a UI button so users can create VARIANT_1 and VARIANT_2 from the variant tabs. Gap closure for UI-05 and the orphaned addVariant procedure.

</domain>

<decisions>
## Implementation Decisions

### Button placement
- + button with "Add" text as last item inside TabsList (browser-tab pattern)
- Simple hover highlight, no tooltip
- No confirmation dialog -- click creates immediately

### Variant selection flow
- Auto-assign next available label: if no VARIANT_1, create VARIANT_1; if VARIANT_1 exists, create VARIANT_2
- Tab display: "Variant 1" / "Variant 2" (human-readable, not raw enum)
- New variant starts empty with default Geometry, BoundaryCondition, MaintenanceConfig (matches existing addVariant behavior)

### Post-creation behavior
- Auto-switch to new variant (update ?v= URL param)
- Sonner success toast: "Variant 1 created"
- Invalidate project.getById query to refetch variant list (no optimistic update)
- Disable + button and show spinner during mutation

### Variant limit UX
- Hide + button entirely when 3 variants exist (BASE + VARIANT_1 + VARIANT_2)
- Button reappears if a variant is deleted
- Race condition: toast error "Variant already exists" + refetch project to sync tab state

### Claude's Discretion
- Exact spinner/loading implementation details
- Error toast styling and duration
- Any animation on new tab appearing

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VariantTabs` (`src/components/project/variant-tabs.tsx`): Current tab component, needs + button added
- `addVariant` mutation (`src/server/trpc/routers/project.ts:258`): Accepts `{projectId, label, description?}`, creates variant with default sub-records
- Sonner toast: Already used throughout app for success/error feedback
- `Tabs`/`TabsList`/`TabsTrigger` from `@/components/ui/tabs`: base-ui tab primitives

### Established Patterns
- URL search param `?v=` for active variant (set in layout.tsx)
- `key={activeVariantId}` wrapper forces remount on variant switch
- Query invalidation after mutations (standard pattern in project router consumers)
- `useMutation` + `onSuccess` for tRPC mutations with toast feedback

### Integration Points
- `src/app/(app)/projects/[id]/layout.tsx`: Renders VariantTabs, manages `activeVariantId` and `handleVariantChange`
- `project.getById` query: Returns `variants: { id, label, description }[]` -- used to populate tabs
- `VARIANT_LABELS = ["VARIANT_1", "VARIANT_2"]` constant in project router

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 10-variant-creation-ui*
*Context gathered: 2026-03-28*

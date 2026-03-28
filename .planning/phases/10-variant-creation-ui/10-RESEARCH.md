# Phase 10: Variant Creation UI - Research

**Researched:** 2026-03-28
**Domain:** React UI wiring to existing tRPC mutation
**Confidence:** HIGH

## Summary

Phase 10 is a small gap-closure phase. All backend infrastructure exists: `addVariant` tRPC mutation (project.ts:258) creates a variant with default Geometry, BoundaryCondition, and MaintenanceConfig sub-records. The UI component `VariantTabs` (variant-tabs.tsx) renders tabs but has no creation affordance. The work is purely UI: add a "+" button inside TabsList, call the existing mutation, handle loading/error states, and auto-switch to the new variant via URL params.

No new dependencies are needed. All patterns (tRPC useMutation, Sonner toast, query invalidation, URL search params) are already established in the codebase.

**Primary recommendation:** Modify `variant-tabs.tsx` to accept `projectId` and variant creation props, add an inline "+" button that calls `project.addVariant`, and auto-switch to the new variant on success.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- + button with "Add" text as last item inside TabsList (browser-tab pattern)
- Simple hover highlight, no tooltip
- No confirmation dialog -- click creates immediately
- Auto-assign next available label: if no VARIANT_1, create VARIANT_1; if VARIANT_1 exists, create VARIANT_2
- Tab display: "Variant 1" / "Variant 2" (human-readable, not raw enum)
- New variant starts empty with default Geometry, BoundaryCondition, MaintenanceConfig (matches existing addVariant behavior)
- Auto-switch to new variant (update ?v= URL param)
- Sonner success toast: "Variant 1 created"
- Invalidate project.getById query to refetch variant list (no optimistic update)
- Disable + button and show spinner during mutation
- Hide + button entirely when 3 variants exist (BASE + VARIANT_1 + VARIANT_2)
- Button reappears if a variant is deleted
- Race condition: toast error "Variant already exists" + refetch project to sync tab state

### Claude's Discretion
- Exact spinner/loading implementation details
- Error toast styling and duration
- Any animation on new tab appearing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-05 | Variant tabs (Base, Variant 1, Variant 2) with data indicator | All code patterns documented below; addVariant mutation exists and is tested |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component rendering | Already in project |
| @tanstack/react-query | 5.x | Mutation + invalidation | Already in project |
| tRPC 11 | 11.x | Type-safe API call | Already in project |
| sonner | latest | Toast notifications | Already in project (DEC-012) |
| Lucide React | latest | Icons (Plus, Loader2) | Already in project |

### Supporting
No new libraries needed.

### Alternatives Considered
None -- all tooling already in the project.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/project/variant-tabs.tsx   # MODIFY: add + button with mutation
├── app/(app)/projects/[id]/layout.tsx    # MODIFY: pass projectId to VariantTabs
```

### Pattern 1: tRPC Mutation with Toast
**What:** Call mutation on click, show toast on success/error, invalidate query
**When to use:** Any user-triggered data change
**Example:**
```typescript
// Established pattern from existing codebase
const trpc = useTRPC();
const queryClient = useQueryClient();

const addVariant = useMutation(
  trpc.project.addVariant.mutationOptions({
    onSuccess: (data) => {
      toast.success(`Variant ${humanLabel(data.label)} created`);
      queryClient.invalidateQueries({ queryKey: trpc.project.getById.queryKey({ projectId }) });
      onVariantChange(data.id); // auto-switch via URL param
    },
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries({ queryKey: trpc.project.getById.queryKey({ projectId }) });
    },
  })
);
```

### Pattern 2: Next Available Label Resolution
**What:** Determine which variant label to create based on existing variants
**When to use:** Before calling addVariant
**Example:**
```typescript
function getNextVariantLabel(variants: Variant[]): "VARIANT_1" | "VARIANT_2" | null {
  const labels = new Set(variants.map(v => v.label));
  if (!labels.has("VARIANT_1")) return "VARIANT_1";
  if (!labels.has("VARIANT_2")) return "VARIANT_2";
  return null; // all slots filled
}
```

### Anti-Patterns to Avoid
- **Optimistic update for variant creation:** Creates complex rollback logic for a rare action. Use simple invalidation instead.
- **Separate modal/dialog for variant creation:** Over-engineering for a one-click action. The context explicitly says no confirmation dialog.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading spinner | Custom CSS animation | Lucide `Loader2` with `animate-spin` | Consistent with project patterns |
| Toast notifications | Custom notification system | `sonner` toast | Already established (DEC-012) |

## Common Pitfalls

### Pitfall 1: Race Condition on Double-Click
**What goes wrong:** User clicks + twice quickly, two mutations fire, second gets CONFLICT
**Why it happens:** Button not disabled during pending mutation
**How to avoid:** Disable button when `addVariant.isPending` is true; show spinner
**Warning signs:** CONFLICT errors in console

### Pitfall 2: Stale Variant List After Creation
**What goes wrong:** New tab doesn't appear because query cache is stale
**Why it happens:** Missing query invalidation after mutation
**How to avoid:** Always invalidate `project.getById` in onSuccess AND onError (error case syncs after race condition)
**Warning signs:** User has to manually refresh to see new variant

### Pitfall 3: Auto-Switch Before Query Settles
**What goes wrong:** Auto-switch to new variant ID, but layout remounts with old data
**Why it happens:** `onVariantChange` called before invalidation completes
**How to avoid:** Call `onVariantChange(data.id)` inside `onSuccess` -- the mutation returns the new variant's ID directly, and the key={activeVariantId} wrapper handles remount

## Code Examples

### Existing VariantTabs Component (current)
```typescript
// src/components/project/variant-tabs.tsx
// Currently: simple tab rendering, no creation
export function VariantTabs({ variants, activeVariantId, onVariantChange }: VariantTabsProps) {
  return (
    <Tabs value={activeVariantId} onValueChange={onVariantChange}>
      <TabsList>
        {variants.map((v) => (
          <TabsTrigger key={v.id} value={v.id}>{v.label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```

### Existing addVariant Mutation (backend)
```typescript
// src/server/trpc/routers/project.ts:258
// Accepts { projectId, label: "VARIANT_1" | "VARIANT_2", description? }
// Creates variant with default Geometry, BoundaryCondition, MaintenanceConfig
// Returns { id, label, description }
// Throws TRPCError CONFLICT if label already exists for project
```

### Existing Layout Integration Point
```typescript
// src/app/(app)/projects/[id]/layout.tsx
// VariantTabs receives: variants, activeVariantId, onVariantChange
// handleVariantChange updates ?v= URL param
// project.getById provides variants array
```

## Open Questions

None -- all patterns are established in the codebase and the scope is fully defined by CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: variant-tabs.tsx, project.ts (addVariant), layout.tsx
- Project STATE.md: mutation patterns, query invalidation patterns documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project
- Architecture: HIGH - modifying existing component with established patterns
- Pitfalls: HIGH - common React mutation patterns, well-documented

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable, no external dependencies)

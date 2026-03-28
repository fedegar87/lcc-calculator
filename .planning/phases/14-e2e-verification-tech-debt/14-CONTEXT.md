# Phase 14: E2E Verification + Tech Debt - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that the complete user workflow functions end-to-end against the Docker PostgreSQL setup (register, login, create project, enter data, view results, export). Resolve two v1.0 tech debt items: document orphaned tRPC procedures and fix z.enum() typing. No new features.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- E2E verification method (manual browser testing, automated script, or documented checklist)
- Bug handling strategy if verification reveals issues (fix in-phase vs track)
- Tech debt documentation format and location for orphaned procedures
- Whether z.enum() fix should propagate beyond export.ts

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Auth pages: `(auth)/login/page.tsx`, `(auth)/register/page.tsx`
- App pages: projects list, project detail with 5 tabs (info, wlc, construction, energy, results)
- 7 tRPC routers: project, variant, cost-item, calculation, export, reference, _shared

### Known Issues
- `src/server/trpc/routers/export.ts:71` — `variantLabel: z.string()` needs `z.enum()`
- `src/server/trpc/routers/project.ts` — orphaned: delete, addMember, removeMember
- `src/server/trpc/routers/cost-item.ts` — orphaned: delete, batchUpsert

### Integration Points
- Docker PostgreSQL (Phase 12) + migrations/seed (Phase 13) provide the database
- Better Auth handles registration/login/logout
- Export endpoints generate PDF and Excel from ResultSnapshot data

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-e2e-verification-tech-debt*
*Context gathered: 2026-03-28*

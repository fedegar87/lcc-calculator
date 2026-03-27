# Phase 9: Export - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can generate PDF and Excel reports that capture a complete, immutable snapshot of their LCC analysis. Every export creates a ResultSnapshot with engine version, formula mode, and input hash for reproducibility. PDF and Excel mutations already stubbed in `src/server/trpc/routers/export.ts`. Prisma models `ResultSnapshot` and `ExportRecord` already exist.

</domain>

<decisions>
## Implementation Decisions

### PDF report content & layout
- **Full report** with these sections in order: cover page (project name, city, date, EURAC logo) → project info summary → boundary conditions → cost breakdown tables (construction 21 categories + WLC/LCC) → KPI cards (LCC, WLC, LCC/m², payback) → charts (LCC stacked bar, cost evolution line) → engine metadata footer (version, formula mode, timestamp)
- **Server-side SVG rendering** for charts — use React server rendering to produce SVG from Recharts components, embed in PDF
- **Per-variant scope** — each export produces one PDF for the currently selected variant. User exports from the active variant tab on the results page
- **EURAC branded** — EURAC red (#C8102E) header bar, EURAC logo on cover page, "LCCzero" in footer, A4 paper format. Professional research institute look

### Excel workbook structure
- Claude's discretion — 5 sheets with computed values (no formulas), structured for offline review
- Researcher and planner determine optimal sheet breakdown based on data model

### Export UX & snapshot flow
- Claude's discretion — button placement on results page, progress feedback, file naming convention
- ResultSnapshot and ExportRecord lifecycle handled per EXPORT-03 requirement

### Claude's Discretion
- Excel sheet naming and content organization (5 sheets)
- Export button placement and interaction pattern
- File naming convention for downloaded files
- Progress/loading state during export generation
- ResultSnapshot creation timing and input hash implementation
- Chart SVG rendering library choice (recharts server render, or lightweight alternative)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The existing results dashboard components (breakdown-table, kpi-card, charts) should inform the PDF content structure.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/trpc/routers/export.ts`: Stub router with `generatePdf` and `generateExcel` mutations — replace NOT_IMPLEMENTED with real logic
- `src/components/results/breakdown-table.tsx`: Construction and WLC/LCC breakdown data shapes — PDF tables mirror these
- `src/components/results/charts/lcc-stacked-bar.tsx`: Recharts stacked bar — server-side SVG source
- `src/components/results/charts/cost-evolution-line.tsx`: Recharts line chart — server-side SVG source
- `src/components/results/kpi-card.tsx`: KPI display format — PDF KPI section mirrors this
- `src/lib/engine/`: Calculation engine with `CalculationResult` type — output structure for snapshots

### Established Patterns
- tRPC protected procedures with Zod input validation — export mutations follow same pattern
- EUR formatting with `Intl.NumberFormat` — reuse in PDF/Excel number formatting
- Variant label enum (`BASE`, `VARIANT_1`, `VARIANT_2`) — used in export input schema

### Integration Points
- `export.ts` already wired into app router — just needs implementation
- `ResultSnapshot` model ready in Prisma schema with `inputs` (Json), `inputsHash`, `outputs` (Json), `trigger` fields
- `ExportRecord` model links to ResultSnapshot with `format`, `fileUrl`, `fileName`
- Results page (`src/app/(app)/projects/[id]/results/page.tsx`) — export buttons go here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-export*
*Context gathered: 2026-03-27*

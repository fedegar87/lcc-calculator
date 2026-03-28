---
phase: 09-export
plan: 01
subsystem: export
tags: [react-pdf, exceljs, sharp, recharts, snapshot, pdf, excel, trpc]

# Dependency graph
requires:
  - phase: 07-trpc-api-authentication
    provides: tRPC router structure, protectedProcedure, calculation router pattern
  - phase: 04-calculation-engine
    provides: calculateLCC engine, LCCResult type, ENGINE_VERSION
  - phase: 08-ui-implementation
    provides: Recharts chart components (stacked bar, cost evolution line)
provides:
  - ResultSnapshot service with deterministic input hashing and upsert
  - Server-side Recharts chart rendering to PNG via sharp
  - PDF document generation with react-pdf (EURAC branding, tables, KPIs, charts)
  - Excel workbook generation with ExcelJS (5 sheets)
  - Working export.generatePdf and export.generateExcel tRPC mutations
  - Shared buildVariantInput utility extracted from calculation router
affects: [09-export-plan-02, ui-export-buttons]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-side-chart-rendering, react-pdf-document, exceljs-workbook, snapshot-deduplication]

key-files:
  created:
    - src/server/export/snapshot.ts
    - src/server/export/chart-renderer.tsx
    - src/server/export/pdf-styles.ts
    - src/server/export/pdf-document.tsx
    - src/server/export/excel-workbook.ts
    - src/server/trpc/routers/_shared.ts
  modified:
    - src/server/trpc/routers/export.ts
    - src/server/trpc/routers/calculation.ts

key-decisions:
  - "Hex colors for SVG chart rendering (sharp librsvg may not support oklch)"
  - "Extract buildVariantInput to _shared.ts for reuse between calculation and export routers"
  - "JSON.parse(JSON.stringify()) for Prisma Json field casting (avoids InputJsonValue type mismatch)"
  - "eslint-disable any cast for renderToBuffer since react-pdf expects DocumentProps but LCCReport wraps Document"

patterns-established:
  - "Shared router utilities in _shared.ts for cross-router reuse"
  - "Snapshot deduplication via SHA-256 hash of sorted VariantInput + FormulaMode"
  - "Server-side Recharts: renderToStaticMarkup -> sharp SVG-to-PNG (no ResponsiveContainer, fixed dimensions)"

requirements-completed: [EXPORT-01, EXPORT-02, EXPORT-03]

# Metrics
duration: 7min
completed: 2026-03-28
---

# Phase 9 Plan 1: Export Pipeline Summary

**Server-side PDF/Excel export with react-pdf EURAC branding, ExcelJS 5-sheet workbook, Recharts chart rendering via sharp, and ResultSnapshot deduplication**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-28T06:45:58Z
- **Completed:** 2026-03-28T06:53:41Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Complete server-side export pipeline: snapshot creation, chart rendering, PDF generation, Excel workbook, tRPC router
- Extracted shared buildVariantInput utility for DRY between calculation and export routers
- Immutable ResultSnapshot with SHA-256 input hashing for export reproducibility and deduplication
- PDF: EURAC-branded report with header, project info, boundary conditions, cost tables, KPIs, embedded chart PNGs
- Excel: 5 sheets (Summary, Construction, Energy, Maintenance, WLC-LCC) with EURAC red header formatting

## Task Commits

Each task was committed atomically:

1. **Task 1: Snapshot service and chart renderer** - `dc5b97d` (feat)
2. **Task 2: PDF document, Excel workbook, and export router** - `6dced64` (feat)

## Files Created/Modified
- `src/server/export/snapshot.ts` - computeInputsHash + getOrCreateSnapshot for ResultSnapshot deduplication
- `src/server/export/chart-renderer.tsx` - Server-side Recharts stacked bar + line chart to PNG via sharp
- `src/server/export/pdf-styles.ts` - react-pdf StyleSheet for A4 layout with EURAC branding
- `src/server/export/pdf-document.tsx` - LCCReport react-pdf Document (header, tables, KPIs, charts, footer)
- `src/server/export/excel-workbook.ts` - ExcelJS 5-sheet workbook builder with EURAC red headers
- `src/server/trpc/routers/_shared.ts` - Extracted d(), resolveDetailCost(), buildVariantInput() shared utilities
- `src/server/trpc/routers/export.ts` - Replaced NOT_IMPLEMENTED stubs with full generatePdf/generateExcel mutations
- `src/server/trpc/routers/calculation.ts` - Refactored to import buildVariantInput from _shared

## Decisions Made
- Used hex colors (#5B8DEF, #4CAF80, etc.) for chart SVG rendering since sharp's librsvg may not support oklch color space
- Extracted buildVariantInput to _shared.ts rather than duplicating between calculation and export routers
- Used JSON.parse(JSON.stringify()) for Prisma Json field assignment to satisfy InputJsonValue type requirements
- Applied any cast for renderToBuffer call since @react-pdf/renderer types expect DocumentProps but our component wraps Document internally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- PrismaClient import path: generated client lives at `src/generated/prisma/client` not `@prisma/client` -- fixed immediately
- react-pdf renderToBuffer type expects `ReactElement<DocumentProps>` but `createElement(LCCReport)` produces `FunctionComponentElement<LCCReportProps>` -- resolved with intermediate any-typed variable

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Export pipeline complete, ready for UI integration (export buttons on results page)
- Plan 09-02 can add download buttons that call these mutations and trigger base64 file downloads

## Self-Check: PASSED

All 9 files verified present on disk. Commits dc5b97d and 6dced64 verified in git log. TypeScript compilation passes (only pre-existing test error in edge-cases.test.ts, out of scope).

---
*Phase: 09-export*
*Completed: 2026-03-28*

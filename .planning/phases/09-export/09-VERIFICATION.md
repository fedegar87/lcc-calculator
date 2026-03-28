---
phase: 09-export
verified: 2026-03-28T07:30:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 9: Export Verification Report

**Phase Goal:** Users can generate PDF and Excel reports that capture a complete, immutable snapshot of their LCC analysis
**Verified:** 2026-03-28T07:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Calling export.generatePdf returns a base64-encoded PDF with project info, tables, charts, KPIs, and engine metadata | VERIFIED | `export.ts` lines 119–178: full pipeline — buildVariantInput -> calculateLCC -> getOrCreateSnapshot -> renderCharts -> renderToBuffer(LCCReport) -> base64. LCCReport includes header, boundary conditions, cost tables, KPIs, charts, footer with engine version. |
| 2 | Calling export.generateExcel returns a base64-encoded Excel workbook with 5 sheets of computed values | VERIFIED | `export.ts` lines 180–267: buildVariantInput -> calculateLCC -> getOrCreateSnapshot -> buildExcelWorkbook -> base64. `excel-workbook.ts` creates sheets: Summary, Construction, Energy, Maintenance, WLC-LCC. |
| 3 | Every export creates an immutable ResultSnapshot record with engine version, formula mode, and input hash | VERIFIED | Both mutations call `getOrCreateSnapshot` (lines 125, 228). `snapshot.ts` stores `engineVersion`, `formulaMode`, `inputsHash`, `inputs`, `outputs`, `trigger: 'export'`. |
| 4 | Existing snapshot with same inputsHash is reused instead of creating a duplicate | VERIFIED | `snapshot.ts` lines 52–58: `db.resultSnapshot.findFirst({ where: { projectId, inputsHash } })` — returns existing record if found. |
| 5 | User sees Export PDF and Export Excel buttons on the results page | VERIFIED | `results/page.tsx` lines 113–141: two buttons with "Export PDF" and "Export Excel" text, FileText and FileSpreadsheet icons. |
| 6 | Clicking Export PDF triggers PDF generation and downloads a .pdf file | VERIFIED | `pdfMutation` calls `trpc.export.generatePdf.mutationOptions`, onSuccess calls `downloadBase64File(data.data, data.fileName, data.mimeType)`. |
| 7 | Clicking Export Excel triggers Excel generation and downloads a .xlsx file | VERIFIED | `excelMutation` calls `trpc.export.generateExcel.mutationOptions`, onSuccess calls `downloadBase64File` with xlsx mimeType. |
| 8 | Buttons show loading state during generation and are disabled to prevent double-clicks | VERIFIED | `pdfMutation.isPending` and `excelMutation.isPending` control `disabled` prop and swap icon to `<Loader2 className="size-4 animate-spin" />`. |
| 9 | Success/error feedback appears via Sonner toast | VERIFIED | onSuccess: `toast.success(...)`, onError: `toast.error(error.message || 'Export failed')` in both mutations. |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/server/export/snapshot.ts` | Input hashing and ResultSnapshot upsert logic | VERIFIED | 79 lines. Exports `computeInputsHash` (SHA-256, sorted keys) and `getOrCreateSnapshot` (findFirst + create). |
| `src/server/export/chart-renderer.tsx` | Server-side Recharts to PNG via sharp | VERIFIED | 149 lines. Exports `renderLCCStackedBarPng` and `renderCostEvolutionPng`. Uses `renderToStaticMarkup` + `sharp(..).png().toBuffer()`. Fixed dimensions, no ResponsiveContainer, hex colors. |
| `src/server/export/pdf-document.tsx` | React-pdf Document component for LCC report | VERIFIED | 290 lines. Exports `LCCReport`. Two-page A4 doc: cover/header, project info, boundary conditions, cost breakdown tables, KPIs, charts, footer with engine metadata. |
| `src/server/export/pdf-styles.ts` | react-pdf StyleSheet for PDF layout | VERIFIED | 92 lines. Exports `styles`. Full set: page, header, headerText, subText, sectionTitle, table, tableHeader, tableRow, tableCell, tableCellRight, tableCellBold, kpiRow, kpiLabel, kpiValue, chartImage, footer. |
| `src/server/export/excel-workbook.ts` | ExcelJS 5-sheet workbook builder | VERIFIED | 243 lines. Exports `buildExcelWorkbook`. 5 sheets: Summary (KPIs), Construction (category breakdown), Energy (yearly cumulated), Maintenance (yearly), WLC-LCC (full breakdown). EURAC red header rows. |
| `src/server/trpc/routers/export.ts` | Working generatePdf and generateExcel mutations | VERIFIED | 268 lines. Both mutations fully implemented — no NOT_IMPLEMENTED stubs. Access control, boundary condition guard, full pipeline, ExportRecord creation. |
| `src/server/trpc/routers/_shared.ts` | Shared buildVariantInput extracted from calculation router | VERIFIED | 177 lines. Exports `d()`, `resolveDetailCost()`, `buildVariantInput()`. Both `calculation.ts` and `export.ts` import from it. |
| `src/lib/download.ts` | Client-side base64-to-file download utility | VERIFIED | 24 lines. Exports `downloadBase64File`. atob -> Uint8Array -> Blob -> createObjectURL -> invisible anchor click -> revokeObjectURL. |
| `src/app/(app)/projects/[id]/results/page.tsx` | Export buttons in results page header | VERIFIED | Imports `FileText`, `FileSpreadsheet`, `Loader2`, `toast`, `downloadBase64File`. Two mutations defined. Buttons rendered with loading state and disabled guard. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/server/trpc/routers/export.ts` | `src/server/export/snapshot.ts` | `getOrCreateSnapshot` call in mutation | WIRED | Lines 14, 125, 228 — imported and called in both mutations. |
| `src/server/trpc/routers/export.ts` | `src/server/export/pdf-document.tsx` | `renderToBuffer(LCCReport)` | WIRED | Lines 19, 144–155 — LCCReport imported, createElement used, renderToBuffer called. |
| `src/server/trpc/routers/export.ts` | `src/server/export/excel-workbook.ts` | `buildExcelWorkbook` call | WIRED | Lines 20, 239–243 — imported and called with result + project + variant. |
| `src/server/export/pdf-document.tsx` | `src/server/export/chart-renderer.tsx` | PNG buffers passed as Image src | WIRED | chartImages prop passed to LCCReport; `<Image src={chartImages.stackedBar} />` and `<Image src={chartImages.costEvolution} />` on page 2. Charts rendered in export.ts lines 136–139 before PDF generation. |
| `src/server/trpc/routers/export.ts` | `src/server/trpc/router.ts` | `exportRouter` registered as `export` key | WIRED | `router.ts` line 16: `export: exportRouter`. |
| `src/app/(app)/projects/[id]/results/page.tsx` | `src/server/trpc/routers/export.ts` | `trpc.export.generatePdf.mutate` and `trpc.export.generateExcel.mutate` | WIRED | Lines 38, 49: `trpc.export.generatePdf.mutationOptions(...)` and `trpc.export.generateExcel.mutationOptions(...)`. |
| `src/app/(app)/projects/[id]/results/page.tsx` | `src/lib/download.ts` | `downloadBase64File` call in onSuccess | WIRED | Line 18: imported. Lines 40, 52: called in onSuccess handlers. |
| `src/server/trpc/routers/calculation.ts` | `src/server/trpc/routers/_shared.ts` | `buildVariantInput` import | WIRED | `calculation.ts` line 8: `import { buildVariantInput } from "./_shared"`. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| EXPORT-01 | 09-01, 09-02 | PDF report with project info, tables, charts, KPIs, engine metadata | SATISFIED | `pdf-document.tsx` renders all sections. `export.ts` generatePdf mutation returns `{ data, fileName, mimeType: 'application/pdf' }`. Results page triggers download. |
| EXPORT-02 | 09-01, 09-02 | Excel workbook with 5 sheets (values only, no formulas) | SATISFIED | `excel-workbook.ts` builds 5 sheets with computed values only — no Excel formula strings used. Results page triggers download. |
| EXPORT-03 | 09-01 | Every export creates immutable ResultSnapshot with engine version and input hash | SATISFIED | `snapshot.ts` `getOrCreateSnapshot` called in both mutations. Stores `engineVersion`, `formulaMode`, `inputsHash`, `inputs` (Json), `outputs` (Json), `trigger: 'export'`. Deduplication via SHA-256 hash. |

No orphaned requirements. All three phase-9 requirements (EXPORT-01, EXPORT-02, EXPORT-03) are claimed by plans and verified in code.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No TODO, FIXME, placeholder, return null, or stub patterns found in any export file. No `throw new TRPCError({ code: 'UNIMPLEMENTED' })` remnants. The export router stubs from phase 7 are fully replaced.

TypeScript compilation: one pre-existing error in `tests/engine/edge-cases.test.ts` (TS2352 type conversion) unrelated to phase 9. All export phase files compile cleanly.

---

### Human Verification Required

#### 1. PDF Visual Layout

**Test:** Trigger export.generatePdf from a project with known cost data, open the downloaded PDF.
**Expected:** EURAC red header with project name; project info table; boundary conditions; construction category table (non-zero rows only); WLC/LCC breakdown table; KPI rows on page 2; two chart images rendered; footer on every page with engine version.
**Why human:** PDF visual rendering and layout cannot be verified by grep.

#### 2. Excel Workbook Column Formatting

**Test:** Open downloaded .xlsx; check each of the 5 sheets.
**Expected:** Summary sheet has EURAC red header row; KPI cells show EUR format; Energy sheet has 1 row per year for the full reference period; WLC-LCC sheet LCC and WLC rows are bold.
**Why human:** ExcelJS cell formatting and number format display require opening in a spreadsheet application.

#### 3. Chart Image Quality in PDF

**Test:** In the exported PDF, inspect the two embedded chart images.
**Expected:** Stacked bar chart shows LCC breakdown by category with legend; line chart shows cost evolution over time with Energy, Maintenance, Total O&M lines.
**Why human:** sharp SVG-to-PNG rendering quality and chart content require visual inspection.

#### 4. Snapshot Deduplication End-to-End

**Test:** Export the same project variant twice without changing any inputs. Check the ResultSnapshot table.
**Expected:** Only one ResultSnapshot record created; both ExportRecord rows reference the same snapshotId.
**Why human:** Requires database inspection or server log review during an actual export run.

---

### Gaps Summary

No gaps. All automated checks pass. The export pipeline is fully implemented across both server-side generation (plan 09-01) and client-side UI (plan 09-02). Key connections are verified end-to-end from the results page button click through tRPC mutation to file generation and browser download.

---

_Verified: 2026-03-28T07:30:00Z_
_Verifier: Claude (gsd-verifier)_

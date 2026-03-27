# Phase 9: Export - Research

**Researched:** 2026-03-27
**Domain:** PDF/Excel report generation, server-side chart rendering, immutable result snapshots
**Confidence:** HIGH

## Summary

Phase 9 implements PDF and Excel export for LCC analysis results. The project already has `@react-pdf/renderer` v4.3.2 and `exceljs` v4.4.0 installed as dependencies, plus `sharp` v0.34.5 for image processing. The existing export router (`src/server/trpc/routers/export.ts`) provides `generatePdf` and `generateExcel` mutation stubs that need real implementations. The Prisma schema already includes `ResultSnapshot` and `ExportRecord` models.

The core technical challenge is embedding charts in the PDF. The recommended approach is: render Recharts components to SVG strings via `renderToStaticMarkup` (React 19 compatible, from `react-dom/server`), convert SVG to PNG buffers using `sharp` (already installed), and embed as `<Image>` components in react-pdf. This avoids the fragile SVG-to-react-pdf-primitives conversion approach.

tRPC v11 natively supports binary response types (Blob, Uint8Array), so mutations can return file buffers directly. For input hashing, Node.js built-in `crypto.createHash('sha256')` with `JSON.stringify` (keys sorted) produces deterministic hashes. No new dependencies needed.

**Primary recommendation:** Use @react-pdf/renderer for PDF, ExcelJS for Excel, sharp for chart SVG-to-PNG conversion, and Node.js crypto for input hashing. All libraries already installed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Full PDF report** with sections in order: cover page (project name, city, date, EURAC logo) -> project info summary -> boundary conditions -> cost breakdown tables (construction 21 categories + WLC/LCC) -> KPI cards (LCC, WLC, LCC/m2, payback) -> charts (LCC stacked bar, cost evolution line) -> engine metadata footer (version, formula mode, timestamp)
- **Server-side SVG rendering** for charts -- use React server rendering to produce SVG from Recharts components, embed in PDF
- **Per-variant scope** -- each export produces one PDF for the currently selected variant. User exports from the active variant tab on the results page
- **EURAC branded** -- EURAC red (#C8102E) header bar, EURAC logo on cover page, "LCCzero" in footer, A4 paper format. Professional research institute look

### Claude's Discretion
- Excel sheet naming and content organization (5 sheets)
- Export button placement and interaction pattern
- File naming convention for downloaded files
- Progress/loading state during export generation
- ResultSnapshot creation timing and input hash implementation
- Chart SVG rendering library choice (recharts server render, or lightweight alternative)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPORT-01 | PDF report with project info, tables, charts, KPIs, engine metadata | @react-pdf/renderer for document structure; Recharts renderToStaticMarkup + sharp for chart-to-PNG; react-pdf SVG primitives for simple elements |
| EXPORT-02 | Excel workbook with 5 sheets (values only, no formulas) | ExcelJS addWorksheet API; styling with column widths, number formats, header rows; writeBuffer for binary output |
| EXPORT-03 | Every export creates immutable ResultSnapshot with engine version and input hash | Prisma ResultSnapshot model (already exists); crypto.createHash('sha256') for inputsHash; transaction wrapping snapshot + export record creation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | ^4.3.2 | PDF document generation from React components | Already installed; React 19 compatible since v4.1.0; rich layout primitives + SVG support |
| exceljs | ^4.4.0 | Excel workbook generation with multi-sheet support | Already installed; full styling, number formatting, column widths; Buffer output |
| sharp | ^0.34.5 | SVG-to-PNG conversion for chart embedding | Already installed; fast native image processing; Buffer.from(svgString) -> .png().toBuffer() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dom/server | (bundled with react-dom 19.2.4) | renderToStaticMarkup for Recharts SSR | Convert Recharts components to SVG strings server-side |
| node:crypto | (built-in) | SHA-256 hashing for input snapshots | createHash('sha256') for deterministic inputsHash |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp for SVG->PNG | SVG string parsing to react-pdf SVG primitives | Direct SVG parsing is fragile (Recharts uses animations, defs, clipPaths that break); sharp is reliable and already installed |
| @react-pdf/renderer | Puppeteer + HTML-to-PDF | Puppeteer requires headless Chrome (heavy, slow); react-pdf is lightweight, already installed |
| exceljs | SheetJS (xlsx) | SheetJS community edition has licensing concerns; ExcelJS is MIT, already installed |
| base64 PDF return via tRPC | tRPC v11 native binary types | tRPC v11 supports Uint8Array/Blob natively; base64 inflates size by ~33% |

**Installation:**
```bash
# No new dependencies needed -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── server/
│   ├── trpc/routers/
│   │   └── export.ts              # tRPC mutations (orchestrator)
│   └── export/
│       ├── pdf-document.tsx       # React-pdf Document component (layout)
│       ├── pdf-styles.ts          # StyleSheet.create() for PDF
│       ├── excel-workbook.ts      # ExcelJS workbook builder
│       ├── chart-renderer.ts      # Recharts -> SVG -> PNG via sharp
│       └── snapshot.ts            # ResultSnapshot creation + hashing
```

### Pattern 1: Server-Side Chart Rendering Pipeline
**What:** Render Recharts components to SVG string, convert to PNG buffer, embed in PDF
**When to use:** Any time a chart needs to appear in the PDF
**Example:**
```typescript
// Source: react.dev/reference/react-dom/server/renderToStaticMarkup + sharp docs
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

async function renderChartToPng(
  data: Array<Record<string, unknown>>,
  width: number,
  height: number,
): Promise<Buffer> {
  // 1. Render Recharts to SVG string (fixed dimensions, no ResponsiveContainer)
  const svgString = renderToStaticMarkup(
    <BarChart width={width} height={height} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" fill="#C8102E" isAnimationActive={false} />
    </BarChart>
  );

  // 2. Convert SVG to PNG via sharp
  const pngBuffer = await sharp(Buffer.from(svgString))
    .png()
    .toBuffer();

  return pngBuffer;
}
```

### Pattern 2: React-PDF Document Component
**What:** Declare PDF layout using react-pdf primitives
**When to use:** The PDF document definition
**Example:**
```typescript
// Source: react-pdf.org/node + react-pdf.org/components
import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: { backgroundColor: "#C8102E", padding: 12, marginBottom: 20 },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  table: { display: "flex", flexDirection: "column" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd" },
  tableCell: { flex: 1, padding: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#666" },
});

interface ReportProps {
  project: { name: string; city: string | null };
  result: LCCResult;
  chartImages: { stackedBar: Buffer; costEvolution: Buffer };
  generatedAt: string;
}

function LCCReport({ project, result, chartImages, generatedAt }: ReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover / Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{project.name}</Text>
          <Text style={{ color: "white", fontSize: 10 }}>{project.city ?? ""}</Text>
        </View>

        {/* Tables, KPIs, etc. using View/Text */}
        {/* ... */}

        {/* Charts as PNG images */}
        <Image src={chartImages.stackedBar} />
        <Image src={chartImages.costEvolution} />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>LCCzero | Engine {result.engineVersion} | {result.formulaMode} | {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

### Pattern 3: ExcelJS Multi-Sheet Workbook
**What:** Build 5-sheet Excel workbook with computed values
**When to use:** The Excel export
**Example:**
```typescript
// Source: exceljs.org + github.com/exceljs/exceljs
import ExcelJS from "exceljs";

async function buildExcelWorkbook(result: LCCResult, project: ProjectData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "LCCzero";
  wb.created = new Date();

  // Sheet 1: Summary
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { header: "KPI", key: "kpi", width: 25 },
    { header: "Value", key: "value", width: 20 },
    { header: "Unit", key: "unit", width: 15 },
  ];
  summary.addRow({ kpi: "LCC", value: result.lcc, unit: "EUR" });
  // ... more KPI rows

  // Sheet 2-5: detailed data per domain
  // ...

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

### Pattern 4: tRPC Mutation Returning Binary Data
**What:** tRPC v11 mutation returns base64-encoded file for client download
**When to use:** Export mutations
**Example:**
```typescript
// Source: trpc.io/blog/announcing-trpc-v11
generatePdf: protectedProcedure
  .input(z.object({
    projectId: z.string(),
    variantLabel: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Load data, run calculation, create snapshot
    // 2. Generate PDF buffer
    // 3. Create ExportRecord in DB
    // 4. Return base64 string for client download
    return {
      data: pdfBuffer.toString("base64"),
      fileName: `LCCzero_${project.name}_${variantLabel}_${timestamp}.pdf`,
      mimeType: "application/pdf",
    };
  }),
```

### Pattern 5: Deterministic Input Hashing
**What:** Create SHA-256 hash of engine inputs for reproducibility
**When to use:** When creating ResultSnapshot records
**Example:**
```typescript
// Source: nodejs.org/api/crypto.html
import { createHash } from "node:crypto";

function hashInputs(variantInput: VariantInput, formulaMode: string): string {
  // Sort keys for deterministic serialization
  const payload = JSON.stringify({ ...variantInput, formulaMode }, Object.keys({ ...variantInput, formulaMode }).sort());
  return createHash("sha256").update(payload).digest("hex");
}
```

### Anti-Patterns to Avoid
- **ResponsiveContainer in server rendering:** Recharts ResponsiveContainer needs browser DOM to measure dimensions. Always use fixed width/height for server-side chart rendering.
- **Animations in server-rendered charts:** Always set `isAnimationActive={false}` on all Recharts components when rendering server-side. Animations use requestAnimationFrame which doesn't exist in Node.js.
- **SVG data URIs in react-pdf Image:** react-pdf's `<Image>` component does NOT support `data:image/svg+xml` URIs. Always convert SVG to PNG first via sharp.
- **Returning raw Buffer via tRPC:** While tRPC v11 supports binary types, superjson serialization and the React Query integration work best with base64 string returns. Return `{ data: base64String, fileName, mimeType }` and create a Blob on the client.
- **Non-deterministic JSON.stringify:** Object key order is insertion-order in JS. Sort keys before hashing to ensure determinism across different data load patterns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF layout engine | Custom HTML-to-PDF pipeline | @react-pdf/renderer | Text wrapping, page breaks, A4 sizing, fonts all handled |
| Excel .xlsx format | Manual XML assembly | ExcelJS | xlsx format is complex ZIP+XML; ExcelJS handles all format details |
| SVG to raster conversion | Canvas-based rendering | sharp | Native C++ performance; handles SVG viewBox, scaling, transparency |
| Input hash comparison | Custom diff algorithm | SHA-256 of sorted JSON | Standard cryptographic hash; collision-resistant; fast |
| PDF table layout | Manual x/y positioning | react-pdf View/Text with flexbox | react-pdf supports flexbox layout natively |

**Key insight:** All three export domains (PDF, Excel, image conversion) have mature libraries already installed in this project. The complexity is in orchestrating them correctly -- not in the individual operations.

## Common Pitfalls

### Pitfall 1: Recharts Server Rendering Fails Silently
**What goes wrong:** Recharts components render as empty SVG when animations are enabled or ResponsiveContainer is used server-side
**Why it happens:** requestAnimationFrame and DOM measurement APIs don't exist in Node.js
**How to avoid:** Always use fixed `width`/`height` props directly on chart components; always set `isAnimationActive={false}` on every Bar, Line, Scatter element
**Warning signs:** Generated PNG is blank or has 0 bytes; SVG string contains no path data

### Pitfall 2: react-pdf renderToStream Memory on Large Documents
**What goes wrong:** PDF generation can consume significant memory for documents with many embedded images
**Why it happens:** PNG chart buffers + PDF buffer all in memory simultaneously
**How to avoid:** Use `renderToStream` instead of `renderToBuffer` when possible; limit chart resolution (300 DPI is unnecessary for screen-oriented PDFs, 150 DPI sufficient)
**Warning signs:** Node.js heap warnings during export generation

### Pitfall 3: ExcelJS Number Formatting Locale Issues
**What goes wrong:** Numbers appear as text in Excel, or EUR formatting uses wrong locale
**Why it happens:** ExcelJS uses Excel's built-in number format codes, not Intl.NumberFormat
**How to avoid:** Use Excel format strings like `#,##0.00` for numbers, `€#,##0.00` for currency. Set `numFmt` on cell styles, not JavaScript string formatting
**Warning signs:** Numbers left-aligned in Excel (text), SUM formulas return 0

### Pitfall 4: Snapshot Race Condition
**What goes wrong:** Two concurrent exports for the same variant create duplicate snapshots
**Why it happens:** No uniqueness constraint on ResultSnapshot for same inputs
**How to avoid:** Use `inputsHash` check -- before creating a new snapshot, query for existing snapshot with same hash. Use Prisma transaction to ensure atomicity
**Warning signs:** Duplicate ExportRecord entries, storage waste

### Pitfall 5: sharp SVG Input Requires Valid Dimensions
**What goes wrong:** sharp fails to convert SVG to PNG with "Input buffer has zero height/width" error
**Why it happens:** Recharts SVG may use viewBox without explicit width/height attributes
**How to avoid:** Always provide explicit `width` and `height` props on the outermost `<BarChart>` / `<LineChart>` component; verify SVG string contains width/height before passing to sharp
**Warning signs:** sharp throws Error during buffer conversion

### Pitfall 6: tRPC Mutation Timeout for Large Exports
**What goes wrong:** Export mutation times out before PDF/Excel generation completes
**Why it happens:** Chart rendering + PDF assembly can take several seconds
**How to avoid:** Keep chart dimensions reasonable (600x300px); use streaming where possible; set appropriate timeout on the tRPC client for export mutations
**Warning signs:** Client receives timeout error; user sees "failed" state

## Code Examples

### Chart Server Rendering (Complete Pipeline)
```typescript
// src/server/export/chart-renderer.ts
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import type { LCCResult } from "@/engine/types";

const CHART_WIDTH = 500;
const CHART_HEIGHT = 280;

const COLORS = {
  design: "#5B8DEF",
  construction: "#4CAF80",
  oAndM: "#D4A843",
  siteManagement: "#9B6FCC",
  energy: "#5B8DEF",
  maintenance: "#D4A843",
  total: "#C8102E",
};

export async function renderLCCStackedBarPng(result: LCCResult): Promise<Buffer> {
  const data = [{
    name: "LCC",
    Design: result.designCosts,
    Construction: result.totalConstruction,
    "O&M": result.operationAndMaintenance,
    "Site Mgmt": result.buildingSiteManagement,
  }];

  const svg = renderToStaticMarkup(
    React.createElement(BarChart, {
      width: CHART_WIDTH, height: CHART_HEIGHT,
      data, layout: "vertical", margin: { left: 20, right: 20 },
    },
      React.createElement(CartesianGrid, { strokeDasharray: "3 3", horizontal: false }),
      React.createElement(XAxis, { type: "number", fontSize: 10 }),
      React.createElement(YAxis, { type: "category", dataKey: "name", width: 40, fontSize: 10 }),
      React.createElement(Legend),
      React.createElement(Bar, { dataKey: "Design", stackId: "lcc", fill: COLORS.design, isAnimationActive: false }),
      React.createElement(Bar, { dataKey: "Construction", stackId: "lcc", fill: COLORS.construction, isAnimationActive: false }),
      React.createElement(Bar, { dataKey: "O&M", stackId: "lcc", fill: COLORS.oAndM, isAnimationActive: false }),
      React.createElement(Bar, { dataKey: "Site Mgmt", stackId: "lcc", fill: COLORS.siteManagement, isAnimationActive: false }),
    )
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCostEvolutionPng(result: LCCResult): Promise<Buffer> {
  const length = result.heatingCosts.cumulated.length;
  const data = Array.from({ length }, (_, i) => ({
    year: i + 1,
    Energy: result.heatingCosts.cumulated[i] + result.coolingCosts.cumulated[i]
      + result.dhwCosts.cumulated[i] + result.householdCosts.cumulated[i]
      - result.pvProduction.cumulated[i],
    Maintenance: result.maintenanceCumulated[i],
    "Total O&M": result.heatingCosts.cumulated[i] + result.coolingCosts.cumulated[i]
      + result.dhwCosts.cumulated[i] + result.householdCosts.cumulated[i]
      - result.pvProduction.cumulated[i] + result.maintenanceCumulated[i],
  }));

  const svg = renderToStaticMarkup(
    React.createElement(LineChart, {
      width: CHART_WIDTH, height: CHART_HEIGHT, data,
      margin: { left: 20, right: 20, top: 5 },
    },
      React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
      React.createElement(XAxis, { dataKey: "year", fontSize: 10 }),
      React.createElement(YAxis, { fontSize: 10 }),
      React.createElement(Legend),
      React.createElement(Line, { type: "monotone", dataKey: "Energy", stroke: COLORS.energy, dot: false, strokeWidth: 2, isAnimationActive: false }),
      React.createElement(Line, { type: "monotone", dataKey: "Maintenance", stroke: COLORS.maintenance, dot: false, strokeWidth: 2, isAnimationActive: false }),
      React.createElement(Line, { type: "monotone", dataKey: "Total O&M", stroke: COLORS.total, dot: false, strokeWidth: 2.5, isAnimationActive: false }),
    )
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
```

### Input Hashing
```typescript
// src/server/export/snapshot.ts
import { createHash } from "node:crypto";
import type { VariantInput, FormulaMode } from "@/engine/types";

export function computeInputsHash(input: VariantInput, formulaMode: FormulaMode): string {
  const sortedPayload = JSON.stringify(
    { input, formulaMode },
    (_, value) => {
      // Sort object keys for determinism
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.keys(value).sort().reduce<Record<string, unknown>>((sorted, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {});
      }
      return value;
    }
  );
  return createHash("sha256").update(sortedPayload).digest("hex");
}
```

### Excel Workbook Builder
```typescript
// src/server/export/excel-workbook.ts (structure pattern)
import ExcelJS from "exceljs";

const EUR_FORMAT = '€#,##0.00';
const PERCENT_FORMAT = '0.0%';
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC8102E" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

function addHeaderRow(ws: ExcelJS.Worksheet, values: string[]) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  return row;
}
```

### Client-Side Download Helper
```typescript
// Client-side: trigger file download from base64 response
function downloadFile(base64: string, fileName: string, mimeType: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer for PDF | @react-pdf/renderer | 2023+ | No headless Chrome needed; lighter, faster |
| SheetJS community | ExcelJS | 2023+ | MIT license; better TypeScript support |
| Canvas-based chart export | renderToStaticMarkup + sharp | 2024+ | No browser DOM needed; pure server-side |
| Base64 file transfer via tRPC | tRPC v11 native binary types | 2024 (v11) | Direct Uint8Array support; though base64 remains simpler with superjson |

**Deprecated/outdated:**
- `react-pdf` v2/v3 SVG support was limited; v4 has comprehensive SVG primitives
- `renderToString` was recommended over `renderToStaticMarkup` for some use cases; for static SVG output, `renderToStaticMarkup` is correct (no React data attributes)

## Open Questions

1. **EURAC Logo Embedding**
   - What we know: The PDF cover page should include the EURAC logo
   - What's unclear: Is the logo file available in the project assets? What format (SVG, PNG)?
   - Recommendation: Use a PNG version of the EURAC logo. If not available, create a text-based placeholder ("EURAC Research") in EURAC red. Logo can be added as a static asset in `public/` or embedded as a base64 constant.

2. **File Storage vs. Inline Return**
   - What we know: ExportRecord has `fileUrl` and `fileName` fields, suggesting files could be stored
   - What's unclear: Whether to store generated files on disk/S3 or just return inline and not persist the binary
   - Recommendation: Return the file inline (base64) for v1. The `fileUrl` field can remain null. Storage adds infrastructure complexity. The ResultSnapshot captures the immutable data; the binary PDF/Excel can be regenerated on demand.

3. **Excel 5-Sheet Organization**
   - What we know: 5 sheets with computed values, no formulas, structured for offline review
   - What's unclear: Exact content per sheet
   - Recommendation: Sheet 1 "Summary" (project info + KPIs), Sheet 2 "Construction" (21-category breakdown), Sheet 3 "Energy" (yearly costs by end-use), Sheet 4 "Maintenance" (yearly element + service costs), Sheet 5 "WLC-LCC" (full WLC/LCC breakdown with all components). This mirrors the data domains.

## Discretion Recommendations

### Excel Sheet Organization (5 sheets)
| Sheet | Name | Content |
|-------|------|---------|
| 1 | Summary | Project metadata, boundary conditions, KPIs, totals |
| 2 | Construction | 21-category breakdown: category, material, labor, other, total |
| 3 | Energy | Yearly costs per end-use (heating, cooling, DHW, household, PV), cumulated |
| 4 | Maintenance | Yearly element maintenance, service maintenance, total, cumulated |
| 5 | WLC-LCC | Design costs, construction, O&M, site mgmt, non-construction, LCC, WLC, residual value, income |

### Export Button Placement
Two buttons in the results page header bar, next to the Dashboard/Compare toggle:
- "Export PDF" button with FileText icon
- "Export Excel" button with FileSpreadsheet icon
Both enabled only when calculation data is loaded. Show loading spinner during generation.

### File Naming Convention
Pattern: `LCCzero_{ProjectName}_{VariantLabel}_{YYYYMMDD}.{ext}`
Example: `LCCzero_Passive-House-Bolzano_BASE_20260327.pdf`
Sanitize project name (replace spaces/special chars with hyphens).

### Progress/Loading State
Use Sonner toast: "Generating PDF..." with loading spinner. On success, trigger download and show "PDF exported successfully". On error, show error toast. Disable the export button during generation to prevent double-clicks.

### ResultSnapshot Creation Timing
Create snapshot BEFORE generating the PDF/Excel. The mutation flow:
1. Load variant data from DB
2. Run `calculateLCC()` to get result
3. Compute `inputsHash` from variant input
4. Check for existing snapshot with same hash (reuse if found)
5. Create ResultSnapshot if new
6. Generate PDF or Excel buffer
7. Create ExportRecord linked to snapshot
8. Return file buffer + metadata

### Chart Rendering Approach
Use `renderToStaticMarkup` + `sharp` (SVG-to-PNG). This is simpler and more reliable than parsing SVG to react-pdf primitives. The existing chart components use oklch colors that sharp handles correctly. Use `React.createElement` instead of JSX in the server module to avoid needing TSX compilation for a server-only file.

## Sources

### Primary (HIGH confidence)
- react-pdf.org/node - renderToStream, renderToFile, renderToString APIs
- react-pdf.org/svg - SVG component primitives (Svg, Rect, Line, Path, Text, etc.)
- react-pdf.org/components - Document, Page, View, Text, Image, StyleSheet
- nodejs.org/api/crypto.html - createHash SHA-256 API
- exceljs.org - Workbook, Worksheet, Column, Row, Cell APIs

### Secondary (MEDIUM confidence)
- github.com/diegomura/react-pdf/discussions/2402 - Next.js 13+ SSR compatibility confirmed for v4
- gist.github.com/kidroca/19e5fe2de8e24aa92a41e94f2d41eda4 - Recharts to react-pdf SVG conversion approach (validated the fragility, informed sharp recommendation)
- trpc.io/blog/announcing-trpc-v11 - Binary type support (Blob, Uint8Array) confirmed
- react.dev/reference/react-dom/server/renderToStaticMarkup - Available in React 19, not deprecated

### Tertiary (LOW confidence)
- None -- all findings verified through primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All three libraries already installed and tested in ecosystem; APIs verified through official docs
- Architecture: HIGH - Pattern of renderToStaticMarkup + sharp is well-documented; react-pdf Document component is straightforward
- Pitfalls: HIGH - Recharts SSR issues (ResponsiveContainer, animations) are widely documented; sharp SVG handling is well-known

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable libraries, unlikely to change significantly)

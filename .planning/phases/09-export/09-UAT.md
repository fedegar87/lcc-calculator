---
status: testing
phase: 09-export
source: 09-01-SUMMARY.md, 09-02-SUMMARY.md
started: 2026-03-28T07:10:00Z
updated: 2026-03-28T07:10:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Export PDF Button & Download
expected: |
  On the Results page, "Export PDF" button is visible in the header bar (next to Dashboard/Compare toggle, separated by a vertical divider). Clicking it shows a loading spinner on the button. After generation completes, a .pdf file downloads automatically. A success toast notification appears.
awaiting: user response

## Tests

### 1. Export PDF Button & Download
expected: On the Results page, "Export PDF" button is visible in the header bar. Clicking it shows a loading spinner. After generation, a .pdf file downloads automatically. Success toast appears.
result: [pending]

### 2. PDF Content (EURAC Branding & Sections)
expected: Open the downloaded PDF. It contains: EURAC red header bar with "EURAC Research" text, project name/city/date on cover, project info summary, boundary conditions, cost breakdown tables (21 construction categories + WLC/LCC), KPI summary (LCC, WLC, LCC/m2, payback), embedded chart images (stacked bar, cost evolution line), and engine metadata footer (version, formula mode, generation date). A4 format.
result: [pending]

### 3. Export Excel Button & Download
expected: On the Results page, "Export Excel" button is visible next to the PDF button. Clicking it shows a loading spinner. After generation, a .xlsx file downloads automatically. Success toast appears.
result: [pending]

### 4. Excel Content (5 Sheets with Values)
expected: Open the downloaded .xlsx. It contains 5 sheets: Summary (project info + KPIs), Construction (21 cost categories with EUR values), Energy (yearly energy costs), Maintenance (yearly maintenance costs), WLC-LCC (full breakdown). Sheets have EURAC red header formatting, EUR number formatting, computed values only (no formulas).
result: [pending]

### 5. File Naming Convention
expected: Downloaded files follow the pattern LCCzero_{ProjectName}_{VariantLabel}_{YYYYMMDD}.pdf (or .xlsx). Special characters in project name are sanitized to hyphens.
result: [pending]

### 6. Export Disabled During Generation
expected: While an export is generating (loading spinner visible), clicking the same button again does nothing (button is disabled). Both buttons can work independently.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]

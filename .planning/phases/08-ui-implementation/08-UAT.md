---
status: testing
phase: 08-ui-implementation
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md
started: 2026-03-27T18:00:00Z
updated: 2026-03-27T18:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Login and Register
expected: |
  Navigate to /register. Fill name, email, password, confirm password. Submit creates account and redirects to /projects.
  Navigate to /login. Enter email/password. Submit redirects to /projects.
awaiting: user response

## Tests

### 1. Login and Register
expected: Navigate to /register, fill all fields, submit. Account created, redirected to /projects. Then /login with same credentials redirects to /projects.
result: [pending]

### 2. Project List and Create
expected: /projects shows grid of project cards (or empty state if none). Click "New Project" opens dialog with name, city, building use, year fields. Submit creates project, card appears in list.
result: [pending]

### 3. Sidebar Navigation
expected: Left sidebar shows project list with names. Clicking a project navigates to its detail page. Sidebar is collapsible. User menu at bottom with sign-out option.
result: [pending]

### 4. Dark Mode (System Preference)
expected: App follows OS dark/light mode automatically. No manual toggle. Colors adjust (dark backgrounds, light text in dark mode). EURAC red remains visible as accent.
result: [pending]

### 5. Wizard Steps (5-step free navigation)
expected: Inside a project, horizontal step bar shows Info, WLC, Construction, Energy, Results. All steps clickable at any time. Progress dots: filled = visited, ring = current, empty = not visited.
result: [pending]

### 6. Variant Tabs
expected: Below wizard steps, tabs for Base, Variant 1, Variant 2. Switching tabs reloads form data for that variant. Active tab is highlighted.
result: [pending]

### 7. Info Form with Autosave
expected: Info step shows metadata (name, city, building use, year), geometry fields (area, stories, etc.), and income inputs. Editing a field triggers autosave after 500ms. Status badge in header shows "Saving..." then "Saved".
result: [pending]

### 8. WLC Form (Boundary Conditions, Energy Prices, Design Costs)
expected: WLC step shows boundary conditions with slider inputs, energy prices table (18 rows from reference data), non-construction costs, and editable design costs table with add/delete rows. All sections autosave independently.
result: [pending]

### 9. Construction Accordions with Detail Rows
expected: Construction step shows 21 cost categories in accordion groups (Building Elements, Building Services, etc.). Expanding a category shows detail rows. Can add/delete detail rows. Fields autosave on blur.
result: [pending]

### 10. EN 15459 Combobox
expected: In construction step, service component section shows a searchable combobox. Typing filters 80+ HVAC components. Selecting one shows lifespan and maintenance percentage.
result: [pending]

### 11. Energy Form (Dual-System, PV, Maintenance)
expected: Energy step shows consumption table with System 1/2 columns for heating, cooling, DHW. Household electricity has single column. PV production field. Maintenance slider (0-10%). All autosave.
result: [pending]

### 12. Results Dashboard with KPI Cards
expected: Navigate to Results step. Auto-calculates (loading skeleton during calculation). Shows 4 KPI cards: LCC, WLC, LCC/m2, payback period. Values formatted in EUR.
result: [pending]

### 13. Breakdown Tables
expected: Results page shows construction breakdown table (21 categories with EUR values and total) and WLC/LCC breakdown table (design, construction, O&M, site management, non-construction with highlighted totals).
result: [pending]

### 14. Charts (Stacked Bar, Line, Grouped Bar)
expected: Results page shows LCC stacked bar chart (4 color segments), cost evolution line chart (cumulative costs over reference period), and variant grouped bar chart. Hover shows tooltips with EUR values.
result: [pending]

### 15. Variant Comparison Side-by-Side
expected: Results page has Dashboard/Compare toggle. Compare view shows all variants side by side with KPI cards, mini charts, and key metrics per variant. Grouped bar at bottom compares across variants.
result: [pending]

## Summary

total: 15
passed: 0
issues: 0
pending: 15
skipped: 0

## Gaps

[none yet]

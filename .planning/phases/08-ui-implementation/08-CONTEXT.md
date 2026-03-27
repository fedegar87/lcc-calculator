# Phase 8: UI Implementation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create projects, enter all LCC parameters through a guided 5-step wizard, and view calculated results with interactive charts. Covers layout, navigation, data entry forms, results dashboard, and variant comparison. Export functionality belongs to Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Wizard Navigation & Flow
- Free navigation: all 5 steps (Info, WLC, Construction, Energy, Results) accessible at any time, no sequential locking
- Variant tabs (Base, Variant 1, Variant 2) always visible across all steps
- Step completion shown with minimal progress dots: filled = completed, ring = current, empty = not visited
- Claude's discretion: step bar placement (horizontal top vs sidebar)

### Data Entry Experience
- Autosave feedback via status badge in header near project name: "Saved" (green), "Saving..." (gray pulse), "Failed" (red) — always visible
- Construction step: 21 cost categories organized in accordion groups by phase (A1-A5, B1-B5, C1-C4, D1, E1). Expanding a category shows detail rows + "Add detail" button
- Form validation triggers on blur. Errors clear when user corrects the value
- EN 15459 service component selector: searchable combobox with type-ahead over 80+ HVAC components, showing component name + lifespan + maintenance %

### Results & Charts Layout
- Bento-style dashboard grid mixing KPI cards (LCC, WLC, LCC/m2, payback), charts, and breakdown tables
- Variant comparison: side-by-side columns (Base, V1, V2) with KPIs and mini-charts per variant
- Chart interactivity: hover tooltips only, no zoom/click actions
- Auto-calculate: results computed automatically when user navigates to Results step, with loading skeleton during calculation

### Glass Morphism & Visual Style
- Subtle glass morphism: mostly solid backgrounds with slight transparency (5-10% alpha) and gentle blur on cards and panels
- Dark mode: follows OS system preference automatically (prefers-color-scheme). No manual toggle
- EURAC red (#C8102E) used sparingly: primary buttons, active wizard step indicator, and key action CTAs only. Rest is neutral grays
- Animations: key transitions only (page/step transitions, accordion open/close, chart entry). No micro-animations. Respects prefers-reduced-motion

### Claude's Discretion
- Wizard step bar placement (horizontal top bar vs sidebar)
- Exact spacing, typography scale, and component sizing
- Loading skeleton design and error state layouts
- Chart color palette for multi-series data
- Form field arrangement and grouping within each step
- Responsive breakpoints and mobile adaptation

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches. Key constraints from requirements:
- 5-step wizard: Info, WLC, Construction, Energy, Results
- 3 chart types: stacked bar (LCC breakdown), line (cost evolution), grouped bar (variant comparison)
- 21 cost categories in Construction step with detail expansion
- Custom components needed: GlassCard, InfoTooltip, SliderInput, KPICard

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- 14 shadcn/ui components: badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, skeleton, sonner, table, tabs
- Glass morphism CSS utilities (.glass, .glass-dark) defined in globals.css
- EURAC color tokens (eurac-red, eurac-dark, eurac-gray, eurac-light) in Tailwind theme
- Dark mode CSS variables fully defined in globals.css
- Inter font loaded with weights 300-700, variable --font-inter
- Sidebar CSS tokens already configured in theme

### Established Patterns
- TRPCReactProvider wraps entire app in root layout
- tRPC routers use protectedProcedure with auth context
- Variant router uses Decimal-to-number conversion helper d()
- Project access controlled via verifyVariantWriteAccess/ReadAccess helpers
- Sonner available for toast notifications (installed as shadcn component)

### Integration Points
- 6 tRPC routers: project (CRUD), variant (per-section upserts), cost-item (CRUD + batch), calculation (engine integration), reference (EN 15459 + energy sources), export (PDF/Excel stub)
- Better Auth client at src/lib/auth-client.ts for session management
- Next.js App Router at src/app/ — all pages to be created
- src/hooks/ directory exists but empty — custom hooks to be created here
- Recharts in dependencies for chart rendering

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-ui-implementation*
*Context gathered: 2026-03-27*

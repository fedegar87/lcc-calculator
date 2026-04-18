# LCC Frontend UI/UX Improvement Prompt

> Copia tutto il contenuto sotto la linea e incollalo in un altro LLM (ChatGPT, Gemini, v0, Claude, ecc.) insieme ai file codice e, se possibile, a 2–3 screenshot delle schermate attuali (info page, construction page, results page). Il prompt è auto-sufficiente.

---

# ROLE

You are a **senior product designer** with deep expertise in:
- **Data-dense B2B / enterprise forms** (ERP, finance, engineering CAD plugins, actuarial tools)
- **Progressive disclosure and information architecture** for long input flows
- **Accessibility (WCAG 2.2 AA)** and inclusive design
- **Form UX patterns**: autosave, validation, wizards, multi-step flows, table inputs, unit handling
- **Data visualization**: KPI dashboards, stacked charts, comparative views
- **Design systems**: shadcn/ui, Tailwind v4, Radix primitives, motion (framer-motion)
- **Domain familiarity with scientific/engineering tools** (building physics, energy modeling, construction cost estimating)

Your output is **actionable, specific, and opinionated**. You do NOT produce vague principles ("consider improving usability"). You produce concrete redesigns: component names, specific field rearrangements, exact tooltip copy, measurable improvements, and — where helpful — short React/JSX sketches in the existing stack.

---

# CONTEXT

An Italian research group (EURAC / Free University of Bolzano) built a **web app to replace a legacy Excel workbook** for **Life Cycle Cost (LCC)** analysis of buildings. The app covers:
- Construction costs across 20+ categories (A1 Roofs → E1 Outdoor, with sub-details and quantities)
- Energy consumption (heating, cooling, DHW, household, PV) with dual-system support and 19 fuel sources
- Maintenance modeling with 30+ building service components from the **EN 15459** standard
- Income projections (3 rent slots, 3 other-income slots, taxes)
- Financial boundary conditions (real/nominal interest rate, inflation, reference period 1–100 years)
- Residual value (ISO 15686-5)
- **Up to 3 design variants** compared side-by-side

**Total input surface:** conservatively **200+ fields** per variant, 600+ for a full 3-variant study.

**The users:** architects, energy consultants, PhD researchers, quantity surveyors. Expert on the *domain* (ISO 15686, EN 15459) but **not necessarily expert on the web app**. They may need to fill a project over multiple sessions across days. They currently waste hours wrestling with the Excel workbook; the web app must be **faster and less error-prone**, not just a port.

**Current stack** (must respect — don't propose rewrites):
- Next.js 15 App Router + React Server Components
- TypeScript, react-hook-form v7 + Zod v4, tRPC v11 + @tanstack/react-query v5
- shadcn/ui + Radix + Tailwind v4 + motion (framer-motion fork)
- Recharts v3 for visualizations
- Prisma + PostgreSQL for persistence
- Better Auth

**Current design tokens:**
- Primary: EURAC red `oklch(0.48 0.18 27.5)` (~#C8102E)
- Inter font, glass-morphism cards (`bg-card/95 backdrop-blur-sm`), OKLCH color palette
- Dark mode supported
- Charts: 5-color OKLCH palette (blue, green, amber, purple, red)
- Radius 10px base, scales with multipliers

---

# RESOURCES TO EXAMINE

## 1. Route map (Next.js App Router)
```
/projects                            → project list
/projects/[id]/info                  → metadata, geometry, income     (~40 fields)
/projects/[id]/wlc                   → boundary conditions, energy prices, non-construction costs, design costs (~30+ fields)
/projects/[id]/construction          → construction cost detail       (100+ fields, dynamic)
/projects/[id]/energy                → energy consumption, PV         (~20 fields)
/projects/[id]/results               → dashboard + variant comparison
/login  /register                    → auth
```

## 2. Key frontend files to read
- `src/app/(app)/projects/[id]/layout.tsx` — variant tabs + wizard steps
- `src/components/project/wizard-steps.tsx` — 5-step visual indicator (visited tracking in localStorage)
- `src/components/project/variant-tabs.tsx` — BASE / VARIANT_1 / VARIANT_2
- `src/components/project/save-status.tsx` — idle / saving / saved / failed
- `src/components/forms/info-form.tsx` — the 40-field info form
- `src/components/forms/wlc-form.tsx` — 656 lines, boundary + energy prices + non-construction + design costs
- `src/components/forms/construction-form.tsx` — 730 lines, accordion per category, dynamic details + service components
- `src/components/forms/energy-form.tsx` — 326 lines, table-driven dual-system entry
- `src/components/forms/shared/en15459-combobox.tsx` — searchable component picker showing lifespan + maintenance %
- `src/components/forms/shared/currency-input.tsx` — EUR with thousand separators (react-number-format)
- `src/components/forms/shared/percent-input.tsx` — stores decimal, displays %
- `src/components/shared/slider-input.tsx` — for reference period
- `src/components/shared/glass-card.tsx` — section container
- `src/components/shared/info-tooltip.tsx` — (i) icon with tooltip copy
- `src/components/results/results-dashboard.tsx` — KPI cards + charts
- `src/components/results/variant-comparison.tsx` — side-by-side variants
- `src/components/results/kpi-card.tsx` — LCC / WLC / LCC/m² / Payback
- `src/components/results/lcc-stacked-bar.tsx` — Design | Construction | O&M | Site Mgmt
- `src/components/results/cost-evolution-line.tsx` — time series
- `src/components/results/variant-grouped-bar.tsx` — variant comparison bar
- `src/hooks/use-autosave.ts` — 500ms debounce
- `src/hooks/use-save-status.tsx` — save status context
- `src/app/globals.css` — OKLCH design tokens

## 3. Reference data (drives many dropdowns)
- `src/engine/constants.ts` + `scripts/output/en15459.json` — 79 maintenance components with lifespan ranges and maint %
- `scripts/output/energy_sources.json` — 18 selectable fuel sources (index 2–19; index 1 is a header sentinel)

## 4. Domain docs (for context, not spec)
- `docs/architecture-decisions.md` — DEC-001..010 (read DEC-005, DEC-009 for unit handling rationale)
- `llc-implementation-plan.md` — original vision

---

# KNOWN PAIN POINTS (DO NOT JUST REPEAT THESE — RESOLVE THEM)

A prior analysis already surfaced these issues. Your job is to **design the fix**, not re-identify the problem.

## A. Input overload with weak progressive disclosure
- Info page dumps 40 fields at once (metadata + geometry + thermal + income) with no conditional visibility based on building use.
- Construction page has 100+ fields behind accordions, but the user has no idea what still needs attention.
- Wizard step bar is purely visual — it tracks `visited` in localStorage, **not "required fields filled"**.

## B. Expert-domain fields without context
- **EN 15459 component index** — combobox is searchable but no link to the standard, no explanation of how lifespan/maint% affect the LCC, no examples.
- **Energy source index** — 19 enum values; users see names but no guidance on which applies to their project.
- **Nominal vs real interest rate** — field is labeled "Nominal Interest Rate" but the distinction is never explained. The maintenance module uses Rint, energy uses RR — this asymmetry is **not exposed to the user at all**.
- **Stakeholder role** (Owner / Tenant / Third Party) — dropdown with no guidance.
- **GFA vs NFA vs TFA** (gross/net/treated floor area) — three separate fields with no definitions.

## C. Unit ambiguity
- `%` fields store **decimal** (0.0151) but display as **percentage** (1.51%). The web form converts on input/output — but if a user pastes 1.51 thinking "1.51%" they may get 151%.
- `PV Production` labeled "kWh/year" but ambiguous: is it total, or per m²? Engine accepts both and normalizes — the UI hides this.
- m², m³, W/m²K, 1/h units shown in labels but no validation of plausible ranges. A user can enter GFA = 10 m² (typo for 1000) with no warning.

## D. Duplicate entry across variants
- To create Variant 1 and Variant 2, user **re-enters all construction costs, energy values, income data**. No "clone Base" button. No diff-aware editing.

## E. No validation summary before results
- User can skip entire sections (e.g., no construction costs entered) and the Results page will still render — just with wrong numbers.
- No "you're missing X, Y, Z" checklist. No red banner.

## F. Sparse help — only ~15 fields have InfoTooltips out of 200+
- No in-app docs, no glossary, no "Learn more" links to ISO 15686-5 / EN 15459 standards, no worked examples.

## G. Calculation opacity
- Results show "LCC = 2,450,000 EUR" with no way to drill into *why*. The user can't audit. For a research tool aimed at PhD users, this erodes trust.
- "Resolved cost = MAX(material, unit × area)" is applied silently.
- KPI named `kpiDesignOverLCC` actually divides by **investment cost**, not LCC. User-facing label may inherit this confusion.

## H. Accessibility gaps
- No ARIA live regions for autosave / validation status (screen readers don't announce "saved").
- Tooltips are hover-only (not keyboard-accessible on the `(i)` icon).
- Chart data not exposed to assistive tech.
- No visible keyboard shortcut help.

## I. Mobile UX
- Construction form dense grid (8 columns per detail row) triggers horizontal scroll on narrow viewports.
- No mobile-specific form layout (e.g., card-per-row instead of table).
- `use-mobile` hook exists but almost unused.

## J. Internationalization
- English only, hardcoded strings. Italian + German would be valuable for EURAC's typical user base.

## K. Comparison UX
- Hard-capped at 3 variants (BASE + 2). Layout doesn't scale if that cap is lifted.
- Side-by-side cards, but no highlighted deltas, no sortable KPI comparison, no "which variant wins on LCC/m²" callout.

## L. Export
- PDF via @react-pdf/renderer (slow, server-rendered, uses React). Excel via exceljs. No CSV / JSON. No shareable web-based view.

---

# METHODOLOGY

Work through each of the following workstreams. For each, **produce concrete deliverables** (see "Expected Deliverable" below) — do not stop at analysis.

## Workstream 1 — Information architecture
Redesign the **top-level flow** given that a typical full project requires 1–3 hours of data entry across 2–5 sessions.

Consider:
- Single wizard vs hub-and-spoke vs tabs-per-section?
- How do you represent **required vs optional vs recommended** fields in the navigation?
- How does the user know they're "done enough to see meaningful results" vs "done enough to publish"?
- How do you handle the case where a section has 70 fields but only 10 are needed for a quick preview?

Deliverable: a navigation / IA diagram (ASCII tree or mermaid is fine) + a "completion model" that drives the step indicator.

## Workstream 2 — Form patterns for each page
For every route page (`/info`, `/wlc`, `/construction`, `/energy`), propose a redesign that:

1. Groups fields by **cognitive chunk** (not just by DB table)
2. Uses **progressive disclosure** (fewer fields visible initially, "Show advanced" reveals more)
3. Applies **conditional visibility** based on building use / stakeholder role / whether a previous field is filled
4. Uses the right input primitive (slider with context vs number with stepper vs segmented control, etc.)
5. Has a clear **completion state** (e.g., green check on the section header when minimum required fields are filled)

For each page, deliver:
- A list of sections with field counts (before / after)
- Which fields are required vs recommended vs advanced
- A 100–200 word description of the flow (what the user sees first, what's behind "Show advanced", etc.)
- One "anchor component" that needs custom design — short JSX sketch (React + shadcn + Tailwind v4 classes)

## Workstream 3 — Help system
Design an in-app help system that scales to 200+ fields without drowning the page.

Consider:
- Tooltips vs inline hint vs side panel vs dedicated glossary page
- How to surface the ISO 15686-5 / EN 15459 standards without requiring users to open PDFs
- "Worked example" pattern: pre-filled demo projects (there are 4 real case studies in `CRAVEzero/` — VälaGård, Héliades, Aspern, Solallen)
- Contextual help that remembers what the user has already seen / dismissed

Deliverable: a help system proposal with:
- Component inventory (reuse existing InfoTooltip + new primitives)
- Copy guidelines (tone, length, examples)
- Concrete tooltip copy (verbatim) for the **12 most confusing fields** (pick them from the pain points list above)
- A "Help center" route structure (if needed)

## Workstream 4 — Units, validation, and data integrity
Redesign how the app handles units and range validation.

Consider:
- Displaying percentages as `%` but storing decimals — how to eliminate paste-mistake risk (e.g. auto-detect if user enters 1.51 vs 0.0151)
- Plausible-range warnings (soft, non-blocking) alongside strict validation
- "Smart defaults" sourced from building use (e.g., residential multi-family typical U-values, typical energy mix)
- A pre-results **validation summary card** that lists missing/suspicious fields

Deliverable:
- A unit convention specification (table: field → stored unit → display unit → input affordance)
- Proposed range-warning ruleset (3–5 examples)
- JSX sketch of the pre-results validation summary card

## Workstream 5 — Variant workflow
Redesign how users create, edit, compare, and manage multiple variants.

Consider:
- "Clone Base" button — what exactly gets copied, what's reset?
- "Diff view" — highlight what's different between variants in the input forms, not just in results
- Whether the 3-variant hard cap should be lifted (Excel has 3; web app could go further)
- Naming, renaming, reordering, archiving variants

Deliverable:
- Interaction spec for variant creation/clone (step-by-step)
- Diff-aware field styling proposal (which visual treatment signals "different from Base"?)
- Updated variant tabs JSX sketch

## Workstream 6 — Results dashboard & comparison
Redesign the results experience so users can **audit** the numbers, not just read them.

Consider:
- KPI card hierarchy (which 4 numbers matter most? what's secondary?)
- Drill-down from KPI → component breakdown → individual cost item
- "Story" view that walks through the LCC composition for a selected variant
- Highlighting which variant wins on each KPI, with a short explanation
- Export formats beyond PDF/Excel (CSV, JSON, shareable read-only link)

Deliverable:
- KPI hierarchy (primary / secondary / tertiary) with justification
- A drill-down interaction spec
- Mockup (ASCII wireframe or JSX sketch) of an "audit" view showing the LCC tree

## Workstream 7 — Accessibility
Bring the app to **WCAG 2.2 AA** with realistic effort.

Deliverables:
- List of concrete ARIA additions (live regions for autosave, role="status" / aria-live="polite", etc.)
- Keyboard interaction spec for InfoTooltip, accordion headers, EN 15459 combobox, slider
- Screen-reader alternative for Recharts visualizations (data table fallback pattern)
- Focus management rules when variant tabs change

## Workstream 8 — Mobile & responsive
The current grid tables break on mobile. Redesign for viewports 360–768px.

Deliverables:
- Breakpoint strategy (pick breakpoints, name them)
- Construction form redesign for mobile (table → card list? swipeable rows? drawer-based edit?)
- When to use drawer/sheet (mobile) vs dialog (desktop)

## Workstream 9 — Internationalization readiness
Propose an i18n strategy that's lightweight but credible for EURAC's EU audience.

Deliverables:
- Library recommendation (next-intl vs react-i18next vs custom) with tradeoffs
- File organization (flat JSON vs namespaced)
- Currency/number formatting strategy (Intl.NumberFormat vs explicit locale)
- Prioritized locale list (IT, DE, EN minimum?)
- Rough effort estimate (story points or day-equivalent)

## Workstream 10 — Motion & microinteractions
The app uses `motion` sparingly (staggered KPI cards, comparison columns). Audit and propose.

Consider:
- Where motion adds clarity (page transitions, validation feedback, save confirmation)
- Where motion adds noise (entering a dense form every time)
- Honoring `prefers-reduced-motion` consistently

Deliverable:
- Motion usage guidelines (3–5 rules)
- 2–3 specific new microinteractions that would improve the UX (with brief JSX sketches using `motion`)

---

# EXPECTED DELIVERABLE

Produce a **single Markdown document** structured as:

## 1. Executive summary (300 words max)
What's the biggest UX leverage? If the team has 4 weeks of design+dev capacity, what do they ship first and why? Be opinionated.

## 2. Redesigned IA + navigation
Diagram + completion model.

## 3. Page-by-page redesign
One section per route (`/info`, `/wlc`, `/construction`, `/energy`, `/results`), each following Workstream 2's deliverable format.

## 4. Component inventory
List of **new components** to build and **existing components** to modify, with estimated effort (S / M / L).

## 5. Copy guidelines + sample tooltip copy (12 fields)
The copy should be usable verbatim.

## 6. Interaction specs
For the tricky flows: variant cloning, validation summary, drill-down, mobile edit.

## 7. Accessibility checklist
Concrete, testable items. Not "improve accessibility" — items like "add `role=status` to the SaveStatus badge".

## 8. Design tokens / style updates
If you recommend adjustments to the color, spacing, or type scale, specify them in OKLCH / rem / Tailwind-compatible syntax. Justify each change.

## 9. Prioritized roadmap
Group your recommendations into 3 tranches:
- **Tranche 1 (1–2 weeks)**: high leverage, low risk
- **Tranche 2 (3–6 weeks)**: substantial work, clear ROI
- **Tranche 3 (later)**: nice-to-have / aspirational

For each item: estimated effort (S/M/L), expected impact (Low/Med/High), dependencies.

## 10. Open questions
Specific things you need the product team to clarify before implementation. Phrase as yes/no or multiple-choice where possible.

---

# RULES OF ENGAGEMENT

1. **No rewrites**. Respect the existing stack: Next.js App Router, shadcn/ui, Tailwind v4, react-hook-form, tRPC, motion, Recharts. If you think a library should change, flag it once in §10 (open questions) and move on.
2. **Concrete over abstract**. "Add a tooltip" is useless. "Add a tooltip to the Nominal Interest Rate field with the copy: *'The interest rate on a loan before adjusting for inflation. For LCC under ISO 15686-5, enter the nominal rate; the app computes the real rate from this and the inflation rate.'*" is useful.
4. **Opinionated**. If you see a field that should be killed, say so. If a wizard is the wrong pattern, say so. Don't hedge.
5. **Respect the domain**. Users are experts in LCC, not in the web app. Don't dumb down the technical terms; explain them.
6. **Show your work in code**. When you sketch a component, use real Tailwind v4 classes, real shadcn component names (`<Card>`, `<Accordion>`, `<Sheet>`), and real prop shapes. Don't invent APIs.
7. **Cite the source files**. When you reference a current behavior, link to the exact file:line that exemplifies it (from the resource list above).
8. **Budget your wireframes**. ASCII is fine. Don't spend 80% of your output on elaborate mockups — the goal is design direction, not pixel-perfect visuals.
9. **Mind the user's Italian background**. EURAC is bilingual (IT/DE/EN); favor clarity over wordplay in copy.
10. **Length**: aim for 4,000–8,000 words total. Dense and useful, not padded.

Start with §1 (executive summary) and §9 (roadmap) last. Report section by section; do not wait until the end to deliver.

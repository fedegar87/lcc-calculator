# LCCzero Frontend UI/UX Improvement Report

## 1. Executive summary

The biggest UX leverage is not a visual refresh. It is replacing the current visited-step wizard with a progress-aware project workspace. Today the app autosaves quickly (`src/hooks/use-autosave.ts:15-57`), but navigation still treats a page as "done" once it has been visited (`src/components/project/wizard-steps.tsx:15-53`). That mismatch is why users can reach Results with materially incomplete inputs, why variants feel expensive to create, and why expert users do not trust the numbers.

If the team has four weeks, ship four things first:

1. A completion model with `Required`, `Recommended`, and `Advanced` counts per section and a pre-results validation summary. This changes the product from "form dump" to "guided analysis".
2. Variant cloning plus diff-aware editing. Current variant creation only adds an empty `VARIANT_1` or `VARIANT_2` shell (`src/components/project/variant-tabs.tsx:31-38`, `src/server/trpc/routers/project.ts:257-295`), which is the highest-friction workflow in the app.
3. A construction "board + workbench" flow. The current accordion/table pattern is dense, horizontally fragile, and gives no completion signal (`src/components/forms/construction-form.tsx:269-347`, `:614-663`).
4. An auditable Results experience. The engine already exposes useful breakdown data, but the UI stops at KPI cards, charts, and flat tables (`src/components/results/results-dashboard.tsx:84-197`, `src/components/results/breakdown-table.tsx:120-163`).

Do not spend the first tranche on a new design language, a larger variant cap, or a full i18n rollout. Keep the existing stack, routes, and glass-card vocabulary, but make the product legible: what is missing, what is optional, what changed in a variant, and why the result is what it is.

## 2. Redesigned IA + navigation

Current state references:

- The project shell only extracts the current URL step and renders a save badge, visited dots, and variant tabs (`src/app/(app)/projects/[id]/layout.tsx:33-84`).
- Wizard progress is stored as local `visited` state, not data completeness (`src/components/project/wizard-steps.tsx:15-53`).
- Results only block on missing boundary conditions or hard engine validation errors, not on incomplete studies (`src/server/trpc/routers/calculation.ts:61-105`, `src/engine/validation.ts:3-56`).

### Proposed IA

```text
/projects/[id]
|- Overview
|  |- Active variant readiness
|  |- Section progress
|  |- Validation summary
|  \- Recent activity / exports
|- /info
|  |- Identity
|  |- Building profile
|  |- Geometry
|  \- Income model
|- /wlc
|  |- Study boundary
|  |- Rates and stakeholder
|  |- Energy price assumptions
|  |- Site and enabling costs
|  \- Design and support costs
|- /construction
|  |- Category board
|  |- Elements workbench
|  |- Services workbench
|  |- RES workbench
|  \- Maintenance defaults
|- /energy
|  |- Heating
|  |- Cooling
|  |- DHW
|  |- Household electricity
|  \- PV production
|- /results
|  |- Summary
|  |- Audit
|  |- Compare
|  \- Exports
\- /help
   |- Glossary
   |- Standards notes
   |- Worked examples
   \- Keyboard shortcuts
```

### Navigation model

Keep the current route set and add one new route: `/projects/[id]` becomes an overview hub instead of a redirect. The top navigation should no longer behave like a linear wizard. It should behave like a workspace header with five sections and one overview entry point. The current route files can stay; the redesign is mostly shell logic plus section-level progress metadata.

Each section gets a badge with:

- `Required`: fields needed for a meaningful preview.
- `Recommended`: fields needed for a trustworthy comparison/export.
- `Warnings`: suspicious but non-blocking inputs.

Each variant gets a status label:

- `Empty`: required count is 0.
- `Preview-ready`: all required fields are satisfied, warnings allowed.
- `Analysis-ready`: all required plus at least 70% of recommended fields.
- `Publish-ready`: all required, at least 90% of recommended, and no high-severity warnings.

### Completion model

| Scope | Rule | UI treatment |
| --- | --- | --- |
| Section | `requiredFilled / requiredTotal` | Numeric chip in section nav |
| Section | `recommendedFilled / recommendedTotal` | Secondary muted chip |
| Section | `highWarnings > 0` | Amber dot with count |
| Variant | All sections preview-ready | Green `Preview-ready` pill on active tab |
| Project | Base plus at least one comparison variant preview-ready | Enables "Compare" scoreboard |
| Export | Active variant publish-ready | Enables PDF/Excel/CSV/JSON export actions |

Two implementation rules matter:

1. Completion cannot be derived from "field exists in the form". Several forms coerce `null` to `0` in default values (`src/components/forms/info-form.tsx:309-327`, `:417-433`, `src/components/forms/wlc-form.tsx:369-382`), so the app needs explicit `acknowledgedEmpty` or `notApplicable` states for zero-valued fields/categories.
2. The step indicator should expose status text, not dots. A screen reader should hear "Construction, preview-ready, 12 of 18 recommended items completed, 2 warnings".

## 3. Page-by-page redesign

### `/info`

Current state references:

- Metadata, geometry, and income are rendered as three large cards on one page (`src/components/forms/info-form.tsx:135-140`).
- Geometry uses `CurrencyInput` even for areas, volumes, and thermal coefficients (`src/components/forms/info-form.tsx:342-376`, `src/components/forms/shared/currency-input.tsx:16-48`).
- Income rows are always present, even when the study is not doing income analysis (`src/components/forms/info-form.tsx:446-506`).

#### Sections and field counts

| Proposed section | Current visible count | Proposed default visible count |
| --- | --- | --- |
| Identity | 8 | 6 |
| Core geometry | 19 | 8 |
| Envelope indicators | mixed into geometry | 5 |
| Unheated/secondary geometry | mixed into geometry | 0 until enabled |
| Income model | 16 | 0 until enabled |

#### Required vs recommended vs advanced

Required:

- `Project name`
- `Building use`
- `Treated floor area`

Recommended:

- `Country`
- `City`
- `Gross floor area`
- `Net floor area`
- `Gross volume`
- `Window area`
- `Total thermal envelope`
- `PV installed capacity` if PV exists

Advanced:

- `Region`
- `Location`
- `Author`
- `Construction year`
- `Balconies area`
- `Other surfaces area`
- `Unheated GFA/NFA/volumes`
- `Avg heat recovery`
- `Air tightness`
- `Manual design & construction cost`

#### Flow

The page opens with a short "Project profile" card and only three required inputs visible above the fold: project name, building use, and treated floor area. Once building use is selected, a compact definitions rail appears for GFA, NFA, and TFA, because those are the fields users most often misread. Geometry is then split into "Heated building", "Envelope indicators", and an optional "Unheated / secondary spaces" section hidden behind a switch. Income should be off by default and explained as a methodology add-on, not a mandatory block. When the user enables income, show two tabs: `Rent income` and `Other income`, plus an inline note that income affects payback and NPV but does not change LCC/WLC totals. Completion on this page should turn green when identity plus treated floor area are present; it should not require every secondary geometry field.

#### Anchor component sketch

```tsx
<Card className="border-border/70 bg-card/95 backdrop-blur-sm">
  <CardHeader className="gap-2 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <CardTitle>Geometry essentials</CardTitle>
      <CardDescription>
        Enter the heated building first. Secondary areas stay hidden until needed.
      </CardDescription>
    </div>
    <Badge variant="secondary">Required for preview</Badge>
  </CardHeader>
  <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="grossFloorArea">Gross floor area</Label>
        <Input id="grossFloorArea" inputMode="decimal" />
        <p className="text-xs text-muted-foreground">m^2</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="netFloorArea">Net floor area</Label>
        <Input id="netFloorArea" inputMode="decimal" />
        <p className="text-xs text-muted-foreground">m^2</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="treatedFloorArea">Treated floor area</Label>
        <Input id="treatedFloorArea" inputMode="decimal" />
        <p className="text-xs text-muted-foreground">m^2</p>
      </div>
    </div>
    <aside className="rounded-xl border bg-muted/35 p-4">
      <h3 className="text-sm font-semibold">Area definitions</h3>
      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="font-medium">GFA</dt>
          <dd className="text-muted-foreground">External envelope basis.</dd>
        </div>
        <div>
          <dt className="font-medium">NFA</dt>
          <dd className="text-muted-foreground">Usable internal area.</dd>
        </div>
        <div>
          <dt className="font-medium">TFA</dt>
          <dd className="text-muted-foreground">Area used for LCC per m^2 KPIs.</dd>
        </div>
      </dl>
      <Alert className="mt-4">
        <AlertTitle>Range check</AlertTitle>
        <AlertDescription>
          TFA should normally not exceed GFA. Review if it does.
        </AlertDescription>
      </Alert>
    </aside>
  </CardContent>
</Card>
```

### `/wlc`

Current state references:

- Boundary conditions only expose reference period, nominal rate, inflation, and stakeholder role (`src/components/forms/wlc-form.tsx:177-225`).
- Energy prices render all selectable sources in one table, even before the user has chosen energy sources on the Energy page (`src/components/forms/wlc-form.tsx:283-345`).
- Percentage inputs store decimals and display percentages (`src/components/forms/shared/percent-input.tsx:33-38`), which matches DEC-009 (`docs/architecture-decisions.md:187-205`) but still leaves paste ambiguity.

#### Sections and field counts

| Proposed section | Current visible count | Proposed default visible count |
| --- | --- | --- |
| Study boundary | 4 | 4 plus 1 derived read-only field |
| Energy price assumptions | 36 editable cells | 2-8 rows for selected sources |
| Site and enabling costs | 12 | 8 |
| Design and support costs | dynamic full table | collapsed summary + expandable rows |

#### Required vs recommended vs advanced

Required:

- `Reference period`
- `Nominal interest rate`
- `Inflation rate`
- `Stakeholder role`

Recommended:

- Energy prices for all sources actually selected on `/energy`
- `Land area`
- `Land price`
- `Planning fees`
- `At least one design cost line` if design fees are part of the study

Advanced:

- `Building index`
- `Floor height`
- Unused energy-source rows
- `User support` and `Finance cost` rows when zero

#### Flow

The page should begin with a "Discounting model" card, not a generic boundary form. Users enter nominal interest and inflation side by side and immediately see the derived real rate in read-only text. Under that, the UI should explain the current engine asymmetry from DEC-005: maintenance uses nominal discounting while energy uses real discounting (`docs/architecture-decisions.md:92-110`). That removes a hidden methodology choice. Energy price assumptions should no longer show 18 blank rows by default. Instead, pull the active sources from `/energy`, render only those rows, and offer an "Edit all sources" drawer for advanced users. Non-construction costs should be grouped by economic logic: site acquisition, project setup, professional fees, operational support. The design fee table stays, but collapsed behind a summary chip until the user explicitly expands it.

#### Anchor component sketch

```tsx
<Card className="border-border/70 bg-card/95">
  <CardHeader>
    <CardTitle>Discounting model</CardTitle>
    <CardDescription>
      Enter the nominal assumptions once. The app derives the real rate for energy.
    </CardDescription>
  </CardHeader>
  <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="interestRate">Nominal interest rate</Label>
        <Input id="interestRate" inputMode="decimal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inflationRate">Inflation rate</Label>
        <Input id="inflationRate" inputMode="decimal" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Stakeholder role</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Owner</SelectItem>
            <SelectItem value="2">Tenant</SelectItem>
            <SelectItem value="3">Third party</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <aside className="rounded-xl border bg-muted/35 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Derived
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">1.27%</div>
      <p className="mt-3 text-sm text-muted-foreground">
        Real rate = (1 + nominal) / (1 + inflation) - 1
      </p>
      <Separator className="my-4" />
      <p className="text-sm">
        Maintenance is discounted with the nominal rate. Energy is discounted
        with the real rate.
      </p>
    </aside>
  </CardContent>
</Card>
```

### `/construction`

Current state references:

- The page is grouped by five broad cost groups, but inside each group the user sees blind accordion headers with no completion status (`src/components/forms/construction-form.tsx:586-663`).
- Detail rows are eight columns wide (`src/components/forms/construction-form.tsx:102-165`, `:283-292`).
- Resolved material cost uses `MAX(materialCost, unitPrice * area)` in both UI and data mapping, but the rule is only implicit (`src/components/forms/construction-form.tsx:96-100`, `:153-155`, `src/server/trpc/routers/_shared.ts:19-28`).
- Service components are stored at variant level and currently rendered under every B/C category because the filter is `_sc => true` (`src/components/forms/construction-form.tsx:628-630`).

#### Sections and field counts

| Proposed section | Current visible count | Proposed default visible count |
| --- | --- | --- |
| Category board | 21 accordion headers | 21 status cards, 0 raw numeric inputs |
| Category workbench | 8 columns per detail row | 4 core fields per detail card |
| Service components | repeated variant-wide list | 3 scoped fields per component |
| Maintenance defaults | 1 slider | 1 paired input with plain-language help |

#### Required vs recommended vs advanced

Required:

- Every category must be in one explicit state: `Detailed`, `Estimated`, or `Not applicable`
- At least one building-element category with non-zero cost
- At least one systems or RES category with non-zero cost, or an explicit "no service components modelled"
- `Building element maintenance percentage`

Recommended:

- Description on every non-zero category
- At least one quantity basis for each major A/B/C category
- EN 15459 component selected for every modelled service component
- Labor and other cost split when known

Advanced:

- Multi-layer detail rows
- Unit-rate based costing with quantity basis
- Imported quantities
- Replacement assumptions notes

#### Flow

The route should open on a board, not an accordion wall. Each cost category becomes a compact status card with category code, total cost, row count, and one of four states: `Missing`, `Estimated`, `Detailed`, `Not applicable`. Clicking a card opens a persistent workbench below the board on desktop, or a bottom sheet on mobile. The workbench starts with a quick-entry row: description, quantity, costing mode (`Lump sum` or `Unit rate x quantity`), and total. Labor and other cost split are hidden under "Show detailed cost breakdown". For B and C categories, the service-components panel sits below the cost rows and is explicitly scoped to the selected category, with an EN 15459 explainer card beside the combobox. This page only turns green when every category has been reviewed; users should not have to open every accordion to know what is still blank.

#### Anchor component sketch

```tsx
<div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
  <Card className="h-fit">
    <CardHeader>
      <CardTitle>Category board</CardTitle>
      <CardDescription>Review every category once.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-2">
      {["A1", "A2", "A3", "B1", "B2", "C2"].map((code) => (
        <button
          key={code}
          type="button"
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-muted/40"
        >
          <span className="font-medium">{code}</span>
          <Badge variant="outline">Missing</Badge>
        </button>
      ))}
    </CardContent>
  </Card>

  <Card className="border-primary/20">
    <CardHeader className="flex-row items-start justify-between gap-4">
      <div>
        <CardTitle>A1 Roofs</CardTitle>
        <CardDescription>
          Start with one estimate. Expand only if you need an auditable breakdown.
        </CardDescription>
      </div>
      <Badge>Estimated</Badge>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="Warm roof package" />
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input inputMode="decimal" placeholder="1,250" />
        </div>
        <div className="space-y-2">
          <Label>Costing mode</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lump">Lump sum</SelectItem>
              <SelectItem value="unit">Unit rate x quantity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Total cost</Label>
          <Input inputMode="decimal" />
        </div>
      </div>
      <Alert>
        <AlertTitle>Resolved material rule</AlertTitle>
        <AlertDescription>
          The app uses the larger of material lump sum and unit rate x quantity.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</div>
```

### `/energy`

Current state references:

- The form is a single wide table with dual-system columns (`src/components/forms/energy-form.tsx:201-324`).
- PV production is a separate card with one ambiguous total-kWh input (`src/components/forms/energy-form.tsx:327-352`).
- Energy source selection exposes raw names only; there is no grouping or guidance even though the reference file distinguishes fuel sources from energy carriers (`src/engine/constants.ts:30-43`, `scripts/output/energy_sources.json:5-120`).

#### Sections and field counts

| Proposed section | Current visible count | Proposed default visible count |
| --- | --- | --- |
| End-use modelling | 15 editable fields in one table | 4 cards with 2 fields each |
| Secondary systems | always visible for heating/cooling/DHW | hidden until enabled |
| PV production | 1 ambiguous field | 1 field plus mode selector and derived preview |

#### Required vs recommended vs advanced

Required:

- Household electricity source and use
- Heating source and use, or explicit `No heating modelled`
- DHW source and use for residential projects, or explicit `No DHW modelled`

Recommended:

- Cooling if applicable
- Second systems where the project actually uses them
- PV production if PV installed capacity is entered on `/info`

Advanced:

- Secondary systems for backup/peak loads
- Source-specific annual escalation overrides
- Specific PV mode instead of total mode

#### Flow

Replace the table with end-use cards: `Heating`, `Cooling`, `DHW`, and `Household electricity`. Each card starts with a simple question: "Is this end use modelled for this project?" If yes, show one system by default. A secondary system only appears when the user activates "Add backup / secondary system". Energy sources should be grouped in the select menu by `Fuel source` and `Energy carrier`, with a one-line helper describing the most common choice. Each card also shows a benchmark band for plausible kWh/m^2/year values. PV becomes a clearer block: first ask whether the value is entered as `Total kWh/year` or `Specific kWh/m^2/year`, then show the derived normalized amount so users know what the engine will use. Completion turns green when all enabled end uses have a source and a consumption value.

#### Anchor component sketch

```tsx
<Card className="border-border/70 bg-card/95">
  <CardHeader className="flex-row items-start justify-between gap-4">
    <div>
      <CardTitle>Heating</CardTitle>
      <CardDescription>Primary heating demand for the active variant.</CardDescription>
    </div>
    <Switch aria-label="Model heating" defaultChecked />
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Primary source</Label>
        <Select>
          <SelectTrigger><SelectValue placeholder="Choose source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Natural Gas</SelectItem>
            <SelectItem value="12">National Electricity-Mix</SelectItem>
            <SelectItem value="14">District heating</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Specific consumption</Label>
        <Input inputMode="decimal" />
        <p className="text-xs text-muted-foreground">kWh/m^2/year</p>
      </div>
    </div>
    <Button variant="ghost" className="px-0 text-sm">
      Add backup / secondary system
    </Button>
    <Alert>
      <AlertTitle>Range guidance</AlertTitle>
      <AlertDescription>
        Residential heating above 250 kWh/m^2/year is unusual. Review if intentional.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>
```

### `/results`

Current state references:

- The results page only toggles between a dashboard and compare view and disables exports with a toast (`src/app/(app)/projects/[id]/results/page.tsx:22-34`, `:58-111`).
- Dashboard KPI hierarchy is flat: LCC, WLC, LCC/m^2, Payback (`src/components/results/results-dashboard.tsx:86-107`).
- Comparison is column-based and assumes at most three variants (`src/components/results/variant-comparison.tsx:56-88`).

#### Sections and field counts

| Proposed section | Current visible count | Proposed default visible count |
| --- | --- | --- |
| Validation summary | none | 1 summary card |
| Primary KPIs | 4 | 4 |
| Audit views | 2 tables + 2 charts | 3 tabs: Summary, Audit, Compare |
| Exports | 2 disabled buttons | 4 actions with readiness gating |

#### Required vs recommended vs advanced

Required:

- None. Results remain visible to support draft work.

Recommended:

- `Preview-ready` status on the active variant to show full KPI cards without a draft banner

Advanced:

- `Publish-ready` to enable full export/share actions
- At least two `Preview-ready` variants to enable winner callouts

#### Flow

Results should stop pretending that every calculation is equally trustworthy. The page opens with a validation summary bar: blockers, warnings, and a one-click link back to incomplete sections. Below that, show four primary KPIs for the active variant, but add a `Draft` badge whenever the variant is not preview-ready. The core navigation inside Results becomes tabs, not a dashboard/compare toggle: `Summary`, `Audit`, `Compare`, `Exports`. `Summary` tells the story in plain language. `Audit` exposes the cost tree and formulas. `Compare` ranks variants by KPI with delta chips and "winner" badges. `Exports` explains which actions are unlocked and why. Keep the current chart components, but pair every chart with a compact data table and an "Explain this number" action that jumps into the audit tree.

#### KPI hierarchy

| Tier | KPI | Why it matters |
| --- | --- | --- |
| Primary | `LCC` | Core decision metric |
| Primary | `WLC` | Shows land/support/finance additions |
| Primary | `LCC/m^2` | Normalizes across project size |
| Primary | `Net present value` or `Payback` | Only when income model is enabled |
| Secondary | `Construction total` | Investment scope |
| Secondary | `O&M total` | Long-term burden |
| Secondary | `Residual value` | End-of-period recovery |
| Secondary | `Real interest rate` | Method transparency |
| Tertiary | `Design / investment`, `Labor / investment`, `O&M / investment` | Diagnostic ratios, not headline metrics |

#### Anchor component sketch

```tsx
<Card className="border-border/70 bg-card/95">
  <CardHeader className="flex-row items-start justify-between gap-4">
    <div>
      <CardTitle>LCC audit</CardTitle>
      <CardDescription>
        Trace every KPI back to its contributing components.
      </CardDescription>
    </div>
    <Tabs defaultValue="tree">
      <TabsList>
        <TabsTrigger value="tree">Tree</TabsTrigger>
        <TabsTrigger value="formula">Formula</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
    </Tabs>
  </CardHeader>
  <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between py-2">
        <span className="font-medium">LCC</span>
        <span className="tabular-nums">EUR 2,450,000</span>
      </div>
      <div className="ml-4 border-l pl-4">
        <div className="flex items-center justify-between py-2">
          <span>Construction</span>
          <span className="tabular-nums">EUR 1,420,000</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span>O&amp;M</span>
          <span className="tabular-nums">EUR 730,000</span>
        </div>
      </div>
    </div>
    <aside className="rounded-xl border bg-muted/35 p-4 text-sm">
      <div className="font-medium">Selected node</div>
      <p className="mt-2 text-muted-foreground">
        O&amp;M = Energy consumed - PV produced + maintenance.
      </p>
      <Button className="mt-4 w-full">Open source rows</Button>
    </aside>
  </CardContent>
</Card>
```

## 4. Component inventory

### New components

| Component | Purpose | Effort |
| --- | --- | --- |
| `ProjectOverviewPanel` | Overview hub with section readiness and recent actions | M |
| `SectionCompletionChip` | Required/recommended/warning counts in nav and headers | S |
| `ValidationSummaryCard` | Pre-results blocker/warning summary with deep links | M |
| `FieldHint` | Inline, always-visible guidance for high-risk fields | S |
| `GlossarySheet` | Right-side help panel with definitions and examples | M |
| `StandardsNoteCard` | Short EN 15459 / ISO 15686-5 context blocks | S |
| `WorkedExampleLauncher` | Opens demo projects/case-study walkthroughs | M |
| `CategoryBoard` | Construction status board | M |
| `CategoryWorkbench` | Desktop construction editor | L |
| `MobileEditSheet` | Mobile-first drawer/sheet for dense form editing | M |
| `VariantCreateDialog` | Clone/empty variant flow | M |
| `VariantDiffBadge` | Signals inherited/changed/reset fields | S |
| `AuditTree` | Drill-down result explorer | L |
| `ChartDataTable` | Accessible table fallback for Recharts | S |
| `LocaleSwitcher` | Locale selection control for future i18n | S |

### Existing components to modify

| Component | Change | Effort |
| --- | --- | --- |
| `src/components/project/wizard-steps.tsx` | Replace visited dots with data-driven completion chips | M |
| `src/app/(app)/projects/[id]/layout.tsx` | Add overview entry, live region, section metadata injection | M |
| `src/components/project/variant-tabs.tsx` | Add clone, rename, archive, diff status, overflow support | M |
| `src/components/project/save-status.tsx` | Add `role="status"` and accessible text | S |
| `src/components/shared/info-tooltip.tsx` | Keyboard label, richer content, link support | S |
| `src/components/forms/shared/percent-input.tsx` | Smart percent parsing and pasted-value disambiguation | M |
| `src/components/forms/shared/currency-input.tsx` | Split into semantic numeric/unit input variants | M |
| `src/components/forms/info-form.tsx` | Re-chunk sections and conditional disclosure | L |
| `src/components/forms/wlc-form.tsx` | Derived real-rate card and filtered energy price rows | L |
| `src/components/forms/construction-form.tsx` | Board/workbench architecture and mobile edit flow | L |
| `src/components/forms/energy-form.tsx` | Card-based end-use modelling and PV mode selector | M |
| `src/components/results/results-dashboard.tsx` | Draft state, KPI hierarchy, audit entry points | M |
| `src/components/results/variant-comparison.tsx` | Winner badges, sortable KPI table, overflow-safe layout | M |
| `src/components/results/charts/*` | Table fallback, descriptions, reduced-motion alignment | M |

## 5. Copy guidelines + sample tooltip copy

### Help system proposal

Current state reference: only a handful of fields use `InfoTooltip`, mostly in energy and maintenance (`src/components/forms/energy-form.tsx:224`, `:330`, `src/components/forms/construction-form.tsx:714`, plus tooltip support in `src/components/shared/slider-input.tsx:35-41`).

Use a three-level help system:

1. `Tooltip`: one definition plus one practical consequence. Use for short clarifications.
2. `Inline hint`: persistent helper text below the field when the risk of mis-entry is high.
3. `Glossary sheet`: right-side panel for standards notes, formulas, and worked examples.

Add one new help route tree:

```text
/help
/help/glossary
/help/standards/en-15459
/help/standards/iso-15686-5
/help/worked-examples
/help/shortcuts
```

Worked examples should use the existing CRAVEzero cases as "demo projects", not static PDFs. The best pattern is "Load example into sandbox project", so the user can inspect pre-filled fields section by section.

Remember dismissed help by `userId + locale + topic`. Do not hide safety-critical help forever: if the user triggers a range warning or percent ambiguity warning, resurface the related help.

### Copy guidelines

- Open with the noun definition, not with filler.
- State why the field changes the calculation or comparison.
- Give one concrete example or range when a mistake is common.
- Keep tooltip copy under 220 characters when possible.
- Prefer `Enter X as...` over abstract phrasing.
- Avoid idioms and wordplay; this app will be localized for Italian and German users.
- Use `real rate`, `nominal rate`, `treated floor area`, and other domain terms consistently.

### Tooltip copy for 12 confusing fields

| Field | Tooltip copy |
| --- | --- |
| Nominal Interest Rate | `The interest rate before inflation is removed. Enter 3.0 for 3.0%, not 0.03. The app derives the real rate used for energy discounting.` |
| Inflation Rate | `Expected general price growth over the study period. Enter 2.0 for 2.0%, not 0.02. Inflation is used to derive the real rate from the nominal rate.` |
| Stakeholder Role | `Choose the party whose costs you want to represent. Owner includes investment and operation. Tenant emphasizes occupancy costs. Third party fits concession or ESCo-style cases.` |
| Gross Floor Area (GFA) | `Area measured to the outer building envelope. Use GFA for building-scale references, not for the LCC per m^2 KPI.` |
| Net Floor Area (NFA) | `Usable internal floor area after subtracting walls and major structural elements. NFA is usually smaller than GFA.` |
| Treated Floor Area (TFA) | `Area served by the conditioned energy systems. This value is used for LCC/m^2 and WLC/m^2. TFA should usually be smaller than or equal to GFA.` |
| PV Production | `Choose whether you are entering total annual PV output or a specific value per m^2. The app normalizes both modes to annual production before calculation.` |
| Energy Source | `Pick the carrier that matches the delivered energy for this end use. Example: district heating is not electricity, even if the building has electric pumps.` |
| EN 15459 Component | `Select the maintenance component that best matches the installed service. Lifespan drives replacement timing; maintenance % drives recurring annual service cost.` |
| Building Element Maintenance % | `Annual maintenance allowance for A-categories such as roofs, facades, and windows. Enter 2.0 for 2.0% of construction cost per year.` |
| Annual Energy Price Increase | `Expected yearly change in real energy price for this source. Use 0 if you do not want a source-specific escalation assumption.` |
| Resolved Cost | `When both material lump sum and unit rate x quantity are entered, the app uses the larger value. This prevents undercounting when one input is incomplete.` |

## 6. Interaction specs

### 6.1 Variant creation, cloning, and diffing

Current state references:

- Variant creation is "Add", not "Create from...", and only allocates the next label (`src/components/project/variant-tabs.tsx:67-94`).
- The backend only creates empty child records for new variants (`src/server/trpc/routers/project.ts:284-293`).
- The schema hard-caps labels at `BASE`, `VARIANT_1`, and `VARIANT_2` (`src/server/trpc/routers/project.ts:16`, `src/generated/prisma/internal/class.ts` excerpt under `enum VariantLabel`).

#### Interaction spec

1. User clicks `New variant`.
2. Dialog asks for:
   - `Name`
   - `Create from`
   - `Why this variant is different` (optional note)
3. `Create from` options:
   - `Clone Base` (recommended)
   - `Clone current variant`
   - `Empty variant`
4. On clone, copy:
   - Geometry
   - Boundary conditions
   - Energy inputs
   - Cost items and details
   - Service components
   - WLC inputs
   - Design costs
   - Income inputs
   - Maintenance config
5. Do not copy:
   - Result snapshots
   - Export records
   - Save status
   - "Reviewed" and "diff cleared" flags
6. After creation, land the user on `/projects/[id]/info?v={newVariantId}` and open a `Review differences` panel.

#### Diff-aware field styling

Use three states relative to Base:

- `Inherited`: no visible treatment; subtle caption `Same as Base`.
- `Changed`: `border-amber-300 bg-amber-50/60 dark:bg-amber-950/20`.
- `Reset/blank`: dashed border plus small `Reset from Base` label.

Add two filters on every page:

- `Show changed only`
- `Show required only`

#### Variant tabs sketch

```tsx
<div className="flex items-center gap-3 overflow-x-auto pb-1">
  <Tabs value={activeVariantId} onValueChange={setActiveVariantId} className="min-w-0 flex-1">
    <TabsList className="h-auto gap-2 bg-transparent p-0">
      {variants.map((variant) => (
        <TabsTrigger
          key={variant.id}
          value={variant.id}
          className="group min-w-[12rem] rounded-xl border bg-card px-3 py-2 data-[state=active]:border-primary"
        >
          <div className="flex w-full items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-sm font-medium">{variant.name}</div>
              <div className="text-xs text-muted-foreground">
                Preview-ready - 12 changed fields
              </div>
            </div>
            <Badge variant="secondary">Base</Badge>
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
  <Button variant="outline">New variant</Button>
</div>
```

### 6.2 Unit convention specification

| Field | Stored unit | Display unit | Input affordance |
| --- | --- | --- | --- |
| `interestRate` | decimal | percent | Smart percent input; accept `3`, `3%`, or `0.03` and confirm interpretation |
| `inflationRate` | decimal | percent | Same as above |
| `annualIncrease` | decimal | percent | Same as above, with per-source hint |
| `rentTaxes` / `otherIncomeTaxes` | decimal | percent | Smart percent input with `Tax rate` helper |
| `buildingElementMaintenancePercent` | decimal | percent | Smart percent input plus slider for coarse adjustment |
| `grossFloorArea` / `netFloorArea` / `treatedFloorArea` | m^2 | m^2 | Numeric input with unit suffix, no currency formatting |
| `grossVolume` / `netVolume` | m^3 | m^3 | Numeric input with unit suffix |
| `avgUvalueOpaque` / `avgUvalueGlazing` | W/m^2K | W/m^2K | Numeric input plus plausible range hint |
| `airTightness` | 1/h | 1/h | Numeric input plus benchmark hint |
| `pvProductionKwh` | kWh/year normalized | user-selected mode + normalized preview | Segmented control: `Total` or `Specific` |

#### Smart percent parsing rule

If the user types:

- `3` or `3.0`, interpret as `3%`
- `0.03`, interpret as `3%` and show inline confirmation `Stored as 3.00%`
- `300`, block with error `This looks like 300%. Did you mean 3.00%?`

This keeps DEC-009 intact while eliminating the classic `1.51` vs `0.0151` failure mode (`docs/architecture-decisions.md:187-205`, `src/components/forms/shared/percent-input.tsx:33-38`).

### 6.3 Range-warning ruleset

Use soft warnings, not hard blocking, unless the value is impossible.

| Rule | Severity | Message |
| --- | --- | --- |
| `TFA > GFA` | high | `Treated floor area is greater than gross floor area. Review area definitions.` |
| `NFA > GFA` | medium | `Net floor area is greater than gross floor area. This is unusual.` |
| `GFA < 50 m^2 or > 500000 m^2` | medium | `Gross floor area is outside the usual project range.` |
| `avgUvalueOpaque < 0.05 or > 3.00` | medium | `Opaque U-value is outside the usual building range.` |
| `airTightness < 0.1 or > 20` | medium | `Air tightness looks unusual for building-envelope data.` |
| `heating use > 400 kWh/m^2/year` | medium | `Heating demand is unusually high. Check units and source selection.` |
| `referencePeriod < lifespan of major service by > 75%` | info | `Reference period is short relative to selected service lifespans.` |

### 6.4 Pre-results validation summary

The current API only enforces missing boundary conditions and basic plausibility (`src/server/trpc/routers/calculation.ts:61-105`, `src/engine/validation.ts:3-56`). The UI needs a stronger pre-results summary.

```tsx
<Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20">
  <CardHeader className="flex-row items-start justify-between gap-4">
    <div>
      <CardTitle>Review before trusting this result</CardTitle>
      <CardDescription>
        2 blockers and 3 warnings affect the active variant.
      </CardDescription>
    </div>
    <Badge variant="outline">Draft result</Badge>
  </CardHeader>
  <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
    <div className="space-y-3">
      <div className="rounded-lg border bg-background p-3">
        <div className="font-medium">Blocker: no construction cost entered for A-group</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Add at least one building-element estimate or mark categories as not applicable.
        </p>
        <Button variant="link" className="px-0">Go to Construction</Button>
      </div>
      <div className="rounded-lg border bg-background p-3">
        <div className="font-medium">Warning: TFA exceeds GFA</div>
        <Button variant="link" className="px-0">Go to Info</Button>
      </div>
    </div>
    <aside className="rounded-lg border bg-background p-4 text-sm">
      <div className="font-medium">Result state</div>
      <ul className="mt-3 space-y-2 text-muted-foreground">
        <li>Preview-ready: no</li>
        <li>Analysis-ready: no</li>
        <li>Publish-ready: no</li>
      </ul>
    </aside>
  </CardContent>
</Card>
```

### 6.5 Drill-down interaction spec

1. User clicks any KPI card or row in the breakdown table.
2. Right-side audit sheet opens.
3. Sheet shows:
   - `Formula`
   - `Contributing components`
   - `Input fields used`
   - `Variant deltas` if not Base
4. Clicking a component node jumps to:
   - source result table row
   - or originating input section (`Info`, `WLC`, `Construction`, `Energy`)
5. For construction nodes, the sheet can drill to category and then to cost detail row.
6. For maintenance nodes, the sheet explains whether the cost comes from flat element maintenance or EN 15459 replacement logic.

The important principle is traceability, not more charts. The user should be able to answer "why is this variant more expensive?" in three clicks.

### 6.6 Breakpoint strategy and mobile edit pattern

Current state reference: a mobile hook already exists, but search shows it is effectively unused beyond the sidebar (`src/hooks/use-mobile.ts:1-19`, `rg` result for `use-mobile`).

#### Breakpoints

| Name | Range | Use |
| --- | --- | --- |
| `compact` | `0-479px` | one-column cards, bottom sheets only |
| `touch` | `480-767px` | one-column forms, two-up metric chips |
| `workbench` | `768-1279px` | split panes, desktop tabs, inline panels |
| `wide` | `1280px+` | comparison layouts, persistent audit rail |

#### Construction mobile redesign

- Replace table rows with stacked detail cards.
- Category board stays as a scrollable list with status and total.
- Tapping a category opens a `Sheet`.
- Inside the sheet, each detail row becomes:
  - description
  - quantity
  - cost mode
  - total
  - optional advanced accordion for labor/other

#### Sheet vs dialog rule

- Use `Sheet` on mobile for dense form editing, glossary content, and audit drill-down.
- Use `Dialog` on desktop for clone/create, destructive confirmation, and export settings.
- Use inline expansion on desktop whenever the action belongs to the same task context.

### 6.7 Internationalization readiness

Recommendation: use `next-intl`, not `react-i18next`, and do not build a custom layer first.

Reasoning:

- The project is already on Next.js App Router and React Server Components (`package.json:36-40`).
- Next.js App Router documentation explicitly frames i18n around locale-segment routing and server-side message loading.
- `next-intl` is purpose-built for App Router, RSC, localized routing, and formatting. `react-i18next` remains strong, but its own docs point Next.js users toward a dedicated Next integration path for SSR/App Router use cases.

Official references used for this recommendation:

- Next.js App Router internationalization guide: https://nextjs.org/docs/app/guides/internationalization
- `next-intl` docs/home: https://next-intl.dev/
- `react-i18next` SSR docs: https://react.i18next.com/latest/ssr

#### File organization

Use namespaced JSON, not one flat file per locale:

```text
messages/
  en/
    common.json
    info.json
    wlc.json
    construction.json
    energy.json
    results.json
    help.json
    validation.json
  it/
  de/
```

#### Formatting strategy

- Currency and numbers: `Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })`
- Plain decimals: `Intl.NumberFormat(locale, { maximumFractionDigits: ... })`
- Units: explicit suffixes for engineering notation such as `W/m^2K` and `1/h`
- Dates in exports and help center: locale-aware display, ISO in filenames

#### Prioritized locales

1. `it-IT`
2. `de-DE`
3. `en`

#### Rough effort

- Infrastructure and routing: `3-4 days`
- String extraction and namespacing: `3-5 days`
- Copy translation for priority routes: `4-6 days`
- QA and layout fixing: `2-3 days`

Total credible first pass: `12-18 working days`.

### 6.8 Motion and microinteractions

Current state references:

- Dashboard cards animate in, but this is not tied to reduced-motion logic (`src/components/results/results-dashboard.tsx:98-104`).
- Chart components already gate animation with `prefers-reduced-motion` (`src/components/results/charts/lcc-stacked-bar.tsx:44-47`, `cost-evolution-line.tsx:53-56`, `variant-grouped-bar.tsx:54-57`).

#### Motion rules

1. Use motion to confirm state change, not to decorate dense form entry.
2. Keep form feedback at `120-180ms`; section/layout changes at `180-260ms`.
3. Prefer opacity and transform only.
4. Do not animate every autosave cycle.
5. Respect `prefers-reduced-motion` consistently across cards, drawers, charts, and validation banners.

#### Microinteractions

`Section completion chip`

```tsx
<motion.div
  initial={{ scale: 0.92, opacity: 0.7 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.16 }}
  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1"
>
  <motion.span layout className="size-2 rounded-full bg-emerald-500" />
  Preview-ready
</motion.div>
```

`Validation item enter/exit`

```tsx
<AnimatePresence initial={false}>
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    />
  ))}
</AnimatePresence>
```

`Audit tree expand`

```tsx
<motion.div
  initial={false}
  animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
  transition={{ duration: 0.18 }}
  className="overflow-hidden"
/>
```

## 7. Accessibility checklist

### ARIA and semantic additions

- Add a single live region near the layout header: `role="status" aria-live="polite" aria-atomic="true"` and mirror save messages into it. The current badge is visual only (`src/components/project/save-status.tsx:32-43`).
- Make `SaveStatusBadge` expose text such as `Saving changes`, `Changes saved`, `Save failed`.
- Give each step in the top nav an accessible label containing status, not just label plus dot.
- Add `aria-label` to every `InfoTooltip` trigger. The current icon button has no text label (`src/components/shared/info-tooltip.tsx:12-20`).
- Add `aria-describedby` connections for inline hints and range warnings.
- Add `aria-invalid="true"` and `aria-errormessage` on fields with blocking validation.
- Add accessible names to compare/export buttons that include active variant name.

### Keyboard interaction spec

- `InfoTooltip`: `Tab` focuses trigger, `Enter`/`Space` opens, `Esc` closes, focus returns to trigger.
- `AccordionTrigger`: arrow keys move between category headers, `Home`/`End` jump to first/last, `Enter`/`Space` toggle.
- `EN15459Combobox`: typing filters, `ArrowDown/Up` navigates options, `Enter` selects, `Esc` closes without selection, result count announced after filtering.
- `SliderInput`: pair slider with a number box so users are not forced into pointer interaction. Announce `aria-valuetext` with unit.
- Variant tabs: arrow keys move between tabs, `Delete` or context-menu actions only in menu, never on plain keypress.

### Charts and screen-reader fallback

- Every chart gets a visible `Table` tab or `View data table` button.
- Each chart container gets an `aria-labelledby` title and a one-sentence summary.
- The table fallback should include exact amounts and units, not percentages only.
- For grouped comparisons, add a small text summary such as `Base has the lowest LCC; Variant 2 has the lowest O&M`.

### Focus management

- When variant tabs change, move focus to the page `<h1>` or page-level section title after the content remount (`src/app/(app)/projects/[id]/layout.tsx:83-84` currently remounts children but does not restore focus).
- When a validation link jumps to another route, focus the target section heading and scroll it into view.
- When a mobile `Sheet` closes, return focus to the category card or row that opened it.

## 8. Design tokens / style updates

Current state references:

- Core tokens already use OKLCH and EURAC red (`src/app/globals.css:51-83`).
- Dense surfaces all use similar glass-card treatment (`src/components/shared/glass-card.tsx:9-18`).

### Token adjustments

| Token | Proposed value | Why |
| --- | --- | --- |
| `--radius` | keep `0.625rem` | Already appropriate; do not churn geometry |
| `--color-warning` | `oklch(0.78 0.14 82)` | Needed for soft validation states |
| `--color-warning-foreground` | `oklch(0.34 0.03 82)` | Keeps warning copy readable |
| `--color-success-soft` | `oklch(0.93 0.06 155)` | Completion backgrounds without harsh green |
| `--color-info-soft` | `oklch(0.94 0.04 250)` | Help rails and derived-value cards |
| `--color-surface-subtle` | `oklch(0.985 0.002 250)` | Breaks the "every card looks identical" problem |
| `--space-section` | `1.5rem` | Consistent vertical rhythm across dense forms |
| `--space-cluster` | `0.75rem` | Better spacing for grouped helper text |
| `--type-kpi` | `clamp(1.75rem, 2vw + 1rem, 2.75rem)` | Improves numeric hierarchy on desktop and mobile |

### Style direction

- Keep Inter. This is a research/engineering tool; expressiveness should come from structure and hierarchy, not a new font stack.
- Reduce heavy glass on dense form pages. Use stronger blur on overview/results cards and flatter surfaces on data-entry workbenches.
- Introduce tinted section headers:
  - `Info`: neutral
  - `WLC`: blue-info tint
  - `Construction`: amber tint
  - `Energy`: cyan/green tint
  - `Results`: red-accent tint
- Use semantic border colors for status:
  - preview-ready `border-emerald-300`
  - warnings `border-amber-300`
  - blockers `border-destructive`
  - changed-from-base `border-amber-300`

### Tailwind-friendly additions

```css
@theme {
  --color-warning: oklch(0.78 0.14 82);
  --color-warning-foreground: oklch(0.34 0.03 82);
  --color-success-soft: oklch(0.93 0.06 155);
  --color-info-soft: oklch(0.94 0.04 250);
  --color-surface-subtle: oklch(0.985 0.002 250);
}
```

### 8b. Visual identity mapping

Current foundation references:

- Global tokens still center on generic card/primary/chart values, not semantic domains (`src/app/globals.css:7-57`, `:59-152`).
- `GlassCard` is still a neutral shell with `rounded-lg border bg-card/95 ... shadow-sm` (`src/components/shared/glass-card.tsx:3-18`).
- Button variants are still generic `default/outline/secondary/...` and need identity-specific extensions (`src/components/ui/button.tsx:8-43`).
- The app shell and project routes are structurally ready for a stronger visual skin, but they do not yet carry a route-level hero or ambient backdrop (`src/app/(app)/layout.tsx:7-23`, `src/app/(app)/projects/page.tsx:122-249`, `src/app/(app)/projects/[id]/results/page.tsx:216-309`).

Freeze the LCC domain mapping as follows:

| LCC domain | Where it appears | Tint proposal | Justification |
| --- | --- | --- | --- |
| Finance / boundary conditions (FIN) | `/wlc` top section, rates, stakeholder, derived real-rate card | `blue-50 / blue-500 / blue-600` | Blue reads as analytical and trustworthy, which fits discounting and stakeholder logic without competing with the brand accent. |
| Construction costs (A1-E1) | `/construction`, category summaries, cost rule help | `amber-50 / amber-500 / amber-600` | Amber evokes built material and site work immediately, while staying distinct from warning/error red. |
| Energy (NRG, heating / cooling / DHW / household) | `/energy`, operating-cost blocks, energy portions of results | `cyan-50 / cyan-500 / cyan-600` | Cyan signals technical building systems and keeps energy consumption visually separate from finance and maintenance. |
| PV production | `/energy` PV card, PV offsets in results | `yellow-50 / yellow-500 / yellow-600` | Yellow maps cleanly to solar generation and makes PV feel like a positive offset rather than another generic energy input. |
| Maintenance (MNT, EN 15459) | service components, maintenance config, maintenance result lines | `teal-50 / teal-500 / teal-600` | Teal communicates ongoing care and lifecycle upkeep, bridging construction and operation without borrowing their colors. |
| Residual value (RES) | results audit, net-residual adjustments | `violet-50 / violet-500 / violet-600` | Violet marks residual value as a distinct end-of-period accounting adjustment, not just another cost bucket. |
| Income / NPV (INC) | `/info` income section, payback/NPV outputs | `emerald-50 / emerald-500 / emerald-600` | Emerald is the clearest visual shorthand for inflow, return, and positive contribution to investment performance. |
| Headline totals (LCC, WLC) | results top-level totals, export summary | `slate-900` panel with `eurac-red` badge | The sibling-app dark summary treatment preserves brand restraint and gives headline totals a consistent "instrument panel" hierarchy. |

Operational rule: every domain uses its own `50` tint for surfaces, `500` for borders/fills, and `600` for icon/text emphasis. `eurac-red` appears only on brand-emphasis words, the primary CTA, focus rings, and the totals badge.

### 8c. Updated design tokens

The visual-identity layer should replace the orphan `chart-1..chart-5` tokens with frozen domain tokens, while keeping OKLCH as the source of truth for EURAC red.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-fin-50: var(--fin-50);
  --color-fin-500: var(--fin-500);
  --color-fin-600: var(--fin-600);
  --color-construction-50: var(--construction-50);
  --color-construction-500: var(--construction-500);
  --color-construction-600: var(--construction-600);
  --color-nrg-50: var(--nrg-50);
  --color-nrg-500: var(--nrg-500);
  --color-nrg-600: var(--nrg-600);
  --color-pv-50: var(--pv-50);
  --color-pv-500: var(--pv-500);
  --color-pv-600: var(--pv-600);
  --color-mnt-50: var(--mnt-50);
  --color-mnt-500: var(--mnt-500);
  --color-mnt-600: var(--mnt-600);
  --color-res-50: var(--res-50);
  --color-res-500: var(--res-500);
  --color-res-600: var(--res-600);
  --color-inc-50: var(--inc-50);
  --color-inc-500: var(--inc-500);
  --color-inc-600: var(--inc-600);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
}

@theme {
  --color-eurac-red: oklch(0.48 0.18 27.5);
  --color-eurac-red-hex: #C8102E;
  --color-fin-50: #eff6ff;
  --color-fin-500: #3b82f6;
  --color-fin-600: #2563eb;
  --color-construction-50: #fffbeb;
  --color-construction-500: #f59e0b;
  --color-construction-600: #d97706;
  --color-nrg-50: #ecfeff;
  --color-nrg-500: #06b6d4;
  --color-nrg-600: #0891b2;
  --color-pv-50: #fefce8;
  --color-pv-500: #eab308;
  --color-pv-600: #ca8a04;
  --color-mnt-50: #f0fdfa;
  --color-mnt-500: #14b8a6;
  --color-mnt-600: #0d9488;
  --color-res-50: #f5f3ff;
  --color-res-500: #8b5cf6;
  --color-res-600: #7c3aed;
  --color-inc-50: #ecfdf5;
  --color-inc-500: #10b981;
  --color-inc-600: #059669;
}

:root {
  --background: oklch(0.98 0.004 248);
  --foreground: oklch(0.21 0.01 248);
  --card: oklch(1 0 0 / 82%);
  --card-foreground: oklch(0.21 0.01 248);
  --popover: oklch(1 0 0 / 95%);
  --popover-foreground: oklch(0.21 0.01 248);
  --primary: oklch(0.48 0.18 27.5);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0.004 248);
  --secondary-foreground: oklch(0.31 0.01 248);
  --muted: oklch(0.96 0.004 248);
  --muted-foreground: oklch(0.55 0.02 248);
  --accent: oklch(0.96 0.004 248);
  --accent-foreground: oklch(0.31 0.01 248);
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: oklch(0.48 0.18 27.5);
  --radius: 0.625rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

@layer utilities {
  .pattern-dots {
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%230f172a' fill-opacity='0.03'%3E%3Ccircle cx='4' cy='4' r='1.2'/%3E%3Ccircle cx='16' cy='12' r='1.2'/%3E%3Ccircle cx='8' cy='20' r='1.2'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 24px 24px;
  }

  .ambient-blob {
    position: absolute;
    border-radius: 9999px;
    filter: blur(64px);
    pointer-events: none;
  }

  .ambient-blob-red {
    background: color-mix(in oklab, #C8102E 10%, transparent);
  }

  .ambient-blob-blue {
    background: color-mix(in oklab, #3b82f6 10%, transparent);
  }

  .ambient-blob-emerald {
    background: color-mix(in oklab, #10b981 10%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Implementation note: delete the current `--chart-1..--chart-5` tokens in `src/app/globals.css:78-82` and `:113-117`, then migrate chart colors to the domain helper in `chart-theme.ts` so no arbitrary chart palette survives.

### 8d. Primitive upgrade diffs

#### `GlassCard`

Current reference: `src/components/shared/glass-card.tsx:3-18`

```tsx
export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-lg",
        "dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

#### `DomainSection`

New wrapper to enforce the frozen color mapping.

```tsx
type Domain = "fin" | "construction" | "nrg" | "pv" | "mnt" | "res" | "inc";

export function DomainSection({
  domain,
  title,
  icon: Icon,
  reference,
  children,
}: {
  domain: Domain;
  title: string;
  icon: LucideIcon;
  reference?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(
      "rounded-xl border-l-4 p-4 shadow-sm",
      domain === "fin" && "border-fin-500 bg-fin-50/30",
      domain === "construction" && "border-construction-500 bg-construction-50/30",
      domain === "nrg" && "border-nrg-500 bg-nrg-50/30",
      domain === "pv" && "border-pv-500 bg-pv-50/30",
      domain === "mnt" && "border-mnt-500 bg-mnt-50/30",
      domain === "res" && "border-res-500 bg-res-50/30",
      domain === "inc" && "border-inc-500 bg-inc-50/30",
    )}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge domain={domain} icon={Icon} />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h2>
          </div>
        </div>
        {reference}
      </div>
      {children}
    </section>
  );
}
```

#### `IconBadge`

```tsx
export function IconBadge({
  domain,
  icon: Icon,
}: {
  domain: Domain;
  icon: LucideIcon;
}) {
  return (
    <div className={cn(
      "flex h-10 w-10 items-center justify-center rounded-xl",
      domain === "fin" && "bg-fin-100 text-fin-600",
      domain === "construction" && "bg-construction-100 text-construction-600",
      domain === "nrg" && "bg-nrg-100 text-nrg-600",
      domain === "pv" && "bg-pv-100 text-pv-600",
      domain === "mnt" && "bg-mnt-100 text-mnt-600",
      domain === "res" && "bg-res-100 text-res-600",
      domain === "inc" && "bg-inc-100 text-inc-600",
    )}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
```

#### `AmbientBackground`

Current mount target: `src/app/(app)/layout.tsx:7-23`

```tsx
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      <div className="ambient-blob ambient-blob-red left-[-6rem] top-[-4rem] h-72 w-72" />
      <div className="ambient-blob ambient-blob-blue right-[-5rem] top-16 h-72 w-72" />
      <div className="ambient-blob ambient-blob-emerald bottom-[-6rem] right-1/4 h-72 w-72" />
    </div>
  );
}
```

#### `InfoTooltip`

Current reference: `src/components/shared/info-tooltip.tsx:11-29`

```tsx
export function InfoTooltip({ content, label = "More information" }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center rounded-full"
      >
        <Info className="size-3.5 text-slate-400" />
      </TooltipTrigger>
      <TooltipContent className="rounded-lg bg-slate-800 px-3 py-2 text-[11px] text-slate-100 shadow-lg">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
```

#### `PercentInput` and `CurrencyInput`

Current references: `src/components/forms/shared/percent-input.tsx:18-89`, `src/components/forms/shared/currency-input.tsx:15-74`

```tsx
<NumericFormat
  {...field}
  customInput={Input}
  className={cn(
    "rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-sm shadow-inner",
    "focus-visible:border-eurac-red focus-visible:ring-1 focus-visible:ring-eurac-red/20",
    fieldState.invalid && "border-destructive",
  )}
/>
```

#### Button variants

Current reference: `src/components/ui/button.tsx:8-43`

```tsx
const buttonVariants = cva(baseClasses, {
  variants: {
    variant: {
      default: "...",
      outline: "...",
      brand:
        "rounded-xl bg-eurac-red px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-eurac-red/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-eurac-red/25",
      reference:
        "rounded-xl bg-gradient-to-r from-fin-50 to-fin-100/80 text-fin-700 ring-1 ring-fin-200/60 active:scale-[0.97]",
    },
  },
});
```

### 8e. Per-route composition sketches

#### `/projects`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <div className="max-w-4xl space-y-4 text-center">
    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      Project workspace
    </div>
    <h1 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
      Life-cycle cost
      <span className="text-eurac-red"> projects</span>
    </h1>
    <p className="text-base text-slate-500">
      Create, resume, and compare building studies.
    </p>
  </div>
  <section className="mt-8 grid gap-4 lg:grid-cols-3">
    <GlassCard className="pattern-dots rounded-3xl" />
    <GlassCard className="pattern-dots rounded-3xl" />
    <GlassCard className="pattern-dots rounded-3xl" />
  </section>
  <div className="mt-6 flex flex-wrap justify-center gap-3">
    <Button variant="brand">New project</Button>
    <Button variant="outline">Browse studies</Button>
  </div>
</main>
```

#### `/projects/[id]/info`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <Hero eyebrow="Project profile" accent="metadata" />
  <div className="space-y-8">
    <DomainSection domain="fin" title="Project identity" icon={Building2} />
    <DomainSection domain="construction" title="Geometry" icon={Calculator} />
    <DomainSection domain="inc" title="Income model" icon={Coins} />
  </div>
</main>
```

#### `/projects/[id]/wlc`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <Hero eyebrow="Whole-life assumptions" accent="finance" />
  <div className="space-y-8">
    <DomainSection
      domain="fin"
      title="Boundary conditions"
      icon={Percent}
      reference={<Button variant="reference">Open ISO note</Button>}
    />
    <DomainSection
      domain="construction"
      title="Non-construction and design costs"
      icon={Coins}
    />
  </div>
</main>
```

#### `/projects/[id]/construction`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <Hero eyebrow="Investment costs" accent="construction" />
  <GlassCard className="rounded-3xl">
    <div className="space-y-4">
      <DomainSection domain="construction" title="Building elements" icon={Hammer} />
      <DomainSection domain="construction" title="Building services" icon={Building2} />
      <DomainSection domain="mnt" title="Service components" icon={Calendar} />
    </div>
  </GlassCard>
</main>
```

#### `/projects/[id]/energy`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <Hero eyebrow="Operational energy" accent="energy" />
  <div className="space-y-8">
    <DomainSection domain="nrg" title="Delivered energy" icon={Zap} />
    <DomainSection domain="pv" title="PV production" icon={Leaf} />
  </div>
</main>
```

#### `/projects/[id]/results`

```tsx
<main className="container mx-auto px-4 py-8 lg:py-12">
  <Hero eyebrow="Results" accent="totals" />
  <div className="grid gap-6 lg:grid-cols-12">
    <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
      <ValidationSummaryCard />
      <GlassCard className="rounded-2xl bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eurac-red/15">
            <Calculator className="h-5 w-5 text-eurac-red" />
          </div>
          <div className="tabular-nums text-3xl font-bold">LCC / WLC</div>
        </div>
      </GlassCard>
    </aside>
    <section className="space-y-8 lg:col-span-8">
      <DomainSection domain="construction" title="Investment" icon={Hammer} />
      <DomainSection domain="nrg" title="Energy" icon={Zap} />
      <DomainSection domain="mnt" title="Maintenance" icon={Calendar} />
      <DomainSection domain="res" title="Residual value" icon={TrendingUp} />
      <DomainSection domain="inc" title="Income and payback" icon={Coins} />
    </section>
  </div>
</main>
```

### 8f. Recharts theme object

```ts
export type LCCDomain =
  | "fin"
  | "construction"
  | "nrg"
  | "pv"
  | "mnt"
  | "res"
  | "inc"
  | "totals";

const DOMAIN_HEX: Record<LCCDomain, string> = {
  fin: "#3b82f6",
  construction: "#f59e0b",
  nrg: "#06b6d4",
  pv: "#eab308",
  mnt: "#14b8a6",
  res: "#8b5cf6",
  inc: "#10b981",
  totals: "#0f172a",
};

export const chartTheme = {
  strokeDasharray: "3 3",
  stroke: "#e2e8f0",
  barSize: 32,
  barRadius: [4, 4, 0, 0] as const,
  tooltipStyle: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    fontSize: 11,
  },
  axisTick: {
    fontSize: 11,
    fill: "#64748b",
  },
};

export function domainColor(domain: LCCDomain) {
  return DOMAIN_HEX[domain];
}
```

## 9. Prioritized roadmap

### Tranche 1 (1-2 weeks)

| Item | Effort | Impact | Dependencies |
| --- | --- | --- | --- |
| Replace visited-step logic with completion model in nav and headers | M | High | section rule definitions |
| Add `ValidationSummaryCard` and draft-state Results banner | M | High | completion model |
| Add smart percent parsing and unit-specific numeric inputs | M | High | none |
| Add derived real-rate card and stakeholder help on `/wlc` | S | High | none |
| Add `role="status"` live region and tooltip accessibility fixes | S | High | none |
| Enable filtered energy price rows for selected sources only | M | Medium | energy source mapping |

### Tranche 2 (3-6 weeks)

| Item | Effort | Impact | Dependencies |
| --- | --- | --- | --- |
| Variant clone dialog and diff-aware editing | M | High | completion metadata |
| Construction category board + workbench | L | High | mobile sheet pattern |
| Results audit tree and KPI drill-down | L | High | validation summary, source mapping |
| Card-based `/energy` redesign with PV mode selector | M | Medium | smart unit input |
| Help system: glossary sheet, standards notes, worked example launcher | M | Medium | copy and content prep |
| Chart data tables and comparison winner badges | M | Medium | results audit data model |

### Tranche 3 (later)

| Item | Effort | Impact | Dependencies |
| --- | --- | --- | --- |
| Full `next-intl` rollout for IT/DE/EN | L | High | string extraction |
| CSV/JSON export and read-only share links | M | Medium | snapshot/export pipeline |
| Soft-cap variant model beyond 3 | L | Medium | Prisma/schema redesign |
| Demo-project onboarding flow using CRAVEzero case studies | M | Medium | help system |
| Locale-aware read-only report links | L | Low | i18n and auth decisions |

## 10. Open questions

1. Should `0` be treated as a valid intentional value for all numeric fields, or do you want explicit `Not applicable` / `Reviewed as zero` toggles for high-risk sections?
2. For Results, do you want draft calculations to remain visible with warnings, or should primary KPIs be hidden until a variant is preview-ready?
3. For construction categories, is a one-line estimate per category acceptable for early-stage studies, or do you require detail-row granularity before a project is considered analysis-ready?
4. For income analysis, should the page stay hidden unless the project explicitly opts into profitability metrics?
5. For stakeholder role, is the intended interpretation strictly financial ownership, or do you need predefined methodology presets per role?
6. Should EN 15459 help stay in-app as concise notes, or do you need downloadable standards excerpts approved by the research team?
7. Do you want the first i18n release to include only UI chrome, or all field help and glossary copy as well?
8. Is lifting the three-variant cap a real near-term requirement, or is "clone/diff within three variants" sufficient for the next release?
9. For read-only sharing, do you prefer authenticated collaborator access only, or public signed links with expiry?
10. Do you want the app to surface recommended default values by building use only, or by building use plus country/region?
11. For `/projects`, should the page adopt the full centered hero composition from the sibling app inside the existing sidebar shell, or do you want a more compact hero so the project list stays visible above the fold?
12. For `/results`, should the strict `lg:col-span-4 / lg:col-span-8` dashboard split also apply to `Compare`, or should `Compare` remain full-width to preserve chart legibility?

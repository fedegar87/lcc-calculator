# LCCzero — Implementation Plan for AI Agent (v4)

> **This document is an instruction set for an AI coding agent.**
> Read it entirely before starting. Execute tasks in order. Do not skip steps.
> The Excel workbook is the source of truth for formulas and behavior.
> Workbook path: `C:\llc-calculator-app\CRAVEzero\200512_LCC_tool_beta_v2.xlsm`

---

## Ground Rules

1. **The Excel workbook is the source of truth** for current behavior. The user manual and tutorial are support documents. When they conflict with the workbook, the workbook wins.

2. **Never guess formulas.** If something is unclear, inspect the workbook programmatically, document the ambiguity, and make a controlled implementation decision.

3. **Separate every deviation from Excel** into one of three categories:
   - `EXCEL_REPLICA` — exact copy of Excel behavior
   - `EXCEL_BUG_FIX` — corrects a known Excel error (documented)
   - `METHOD_IMPROVEMENT` — intentional methodology change (documented)

4. **The calculation engine must be pure:** synchronous, deterministic, framework-independent, testable without DB or UI. No business logic in React components, routers, hooks, or exports.

5. **Use Decimal for money.** Prisma `Decimal` for all monetary values, rates, and energy prices in the DB. In the TypeScript engine, use standard `number` (IEEE 754 double is sufficient for this domain's precision requirements — we're computing building LCC, not trading derivatives) but apply controlled rounding at output boundaries. Document rounding strategy.

6. **Formula correctness > test coverage > structure > UX polish.** Do not optimize visually before correctness.

7. **Commit frequently** using conventional commits. One concern per commit.

8. **If you detect inconsistencies in this plan, stop and document them** before proceeding.

---

## Design System

The UI follows a **glass morphism** design language inspired by a proven EURAC project implementation.

### Color Palette

```
Primary (CTA):       #C8102E  (EURAC red)
Primary hover:       #A00D24
Primary light:       #FEF2F2 (red-50 tint for backgrounds)

Gray-900 (headings):  #404648
Gray-600 (body):      #666B6C
Gray-400 (muted):     #B2B5B5
Gray-100 (borders):   #F3F4F6
White:                #FFFFFF

Domain accents (charts, badges):
  Energy:     #06B6D4  (cyan-500)
  Thermal:    #EC4899  (pink-500)
  Cost:       #F59E0B  (amber-500)
  Savings:    #10B981  (emerald-500)

Status:
  Success:    #10B981
  Warning:    #F59E0B
  Error:      #EF4444
  Info:       #3B82F6
```

### Typography

**Font:** Inter (Google Fonts), weights 300–700.

```
Headings:  font-semibold (600)
Body:      font-normal (400)
Labels:    font-medium (500), text-sm, uppercase tracking-wide
Captions:  font-light (300), text-xs
```

Load via `next/font/google`:
```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })
```

### Glass Morphism Components

**GlassCard** — the primary container:
```
bg-white/80 backdrop-blur-sm
border border-white/20
rounded-2xl
shadow (3 levels):
  sm:  shadow-sm                       (form fields)
  md:  shadow-md                       (cards)
  lg:  shadow-lg + shadow-black/5      (modals, popovers)
hover: shadow-lg transition-shadow duration-300
```

**Inputs:**
```
bg-white/60 backdrop-blur-sm
border border-gray-200
rounded-xl
focus: ring-2 ring-primary/20 border-primary
```

**Buttons:**
```
Primary:   bg-[#C8102E] text-white rounded-xl hover:bg-[#A00D24] shadow-md
Secondary: bg-white/80 border border-gray-200 rounded-xl hover:bg-gray-50
Ghost:     bg-transparent hover:bg-white/40
```

### Animations (Framer Motion)

```typescript
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
export const slideUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
export const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3 } }
```

**Respect `prefers-reduced-motion`:** wrap all motion in a `useReducedMotion()` check. When reduced motion is preferred, skip animations entirely (instant transitions).

### Responsive Layout

Mobile-first breakpoints:
```
default:  1 column   (mobile)
md:       2-3 columns (tablet)
lg:       3-4 columns (desktop)
```

Grid pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Accessibility

- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2`
- **Touch targets:** minimum 44px height for all interactive elements
- **Semantic HTML:** `<main>`, `<nav>`, `<section>`, `<article>`, `aria-label` on icon-only buttons
- **Color contrast:** all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Form labels:** every input has an associated `<label>` or `aria-label`

### Custom Components

Beyond shadcn/ui base, implement:
- **GlassCard**: frosted glass container (see spec above)
- **InfoTooltip**: `(i)` icon with hover/focus tooltip for field help text
- **SliderInput**: combined slider + number input for percentage fields (maintenance %, rates)
- **KPICard**: large metric display with label, value, unit, and optional trend indicator

### Tailwind Config Extensions

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#C8102E', hover: '#A00D24', light: '#FEF2F2' },
        eurac: { gray: { 900: '#404648', 600: '#666B6C', 400: '#B2B5B5' } },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { '2xl': '1rem', xl: '0.75rem' },
      backdropBlur: { sm: '4px' },
    },
  },
}
```

---

## Repository & Git

**GitLab remote:** `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`

```bash
cd C:\llc-calculator-app
git init
git remote add origin https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git
git branch -M main
```

**Commit convention:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
**Push after every completed TASK.** Format: `feat: TASK N — short description`

---

## Project Context

LCCzero replaces the CRAVEzero Excel tool with a web application for Life-Cycle Cost analysis of nZEB buildings (ISO 15686-5:2017, EN 15459:2018).

The tool calculates total building ownership cost over a reference period (typically 40 years): non-construction costs, design, construction (materials + labor), energy (heating, cooling, DHW, household, PV), maintenance (annual + component replacement), residual value, and income-based profitability analysis. It supports a base case + 2 design variants compared side by side.

**METHOD_IMPROVEMENT vs Excel:** Two features are implemented that do NOT exist in the Excel workbook:
- **Residual value** (ISO 15686-5 provision, column BC in Excel exists as header but has no formulas)
- **Income-based analysis** (payback period, NPV — Excel collects income data but never uses it in calculations)

Both are documented as METHOD_IMPROVEMENT.

### Reference files

```
C:\llc-calculator-app\CRAVEzero\           <- DO NOT MODIFY
├── 200512_LCC_tool_beta_v2.xlsm           <- THE SOURCE OF TRUTH
├── LCC_User_s_Manual_v2.docx
└── LCC_Tutorial_Script.docx
```

---

## TASK 0: Project Scaffolding

### 0.1 Project structure

Working directory: `C:\llc-calculator-app`

```
C:\llc-calculator-app\
├── CRAVEzero/                          <- EXISTING, DO NOT TOUCH
├── docs/                               <- NEW: documentation deliverables
│   ├── excel-audit.md                  # Workbook reverse-engineering notes
│   ├── formula-map.md                  # Complete formula inventory
│   └── decisions.md                    # Architecture decisions log
├── scripts/                            <- NEW: one-off audit scripts
│   ├── extract_excel_formulas.py
│   └── extract_lookup_tables.py
├── src/
│   ├── app/                            # Next.js App Router pages
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── project/[id]/
│   │   │   ├── page.tsx                # Redirects to step 1
│   │   │   ├── info/page.tsx           # Step 1: Project Info
│   │   │   ├── wlc/page.tsx            # Step 2: WLC costs
│   │   │   ├── construction/page.tsx   # Step 3: Construction costs
│   │   │   ├── energy/page.tsx         # Step 4: Energy & Maintenance
│   │   │   └── results/page.tsx        # Step 5: Results & Export
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn/ui base + custom
│   │   │   ├── glass-card.tsx          # Frosted glass container
│   │   │   ├── info-tooltip.tsx        # (i) help tooltip
│   │   │   ├── slider-input.tsx        # Slider + number input combo
│   │   │   └── kpi-card.tsx            # Large metric display
│   │   ├── forms/
│   │   │   ├── project-info-form.tsx
│   │   │   ├── wlc-form.tsx
│   │   │   ├── construction-form.tsx
│   │   │   ├── energy-form.tsx
│   │   │   └── cost-category-card.tsx
│   │   ├── charts/
│   │   │   ├── lcc-breakdown-chart.tsx  # Stacked bar: WLC components
│   │   │   ├── cost-evolution-chart.tsx # Line: cumulated costs over years
│   │   │   └── variant-comparison-chart.tsx # Grouped bar: variant comparison
│   │   └── layout/
│   │       ├── app-sidebar.tsx
│   │       ├── variant-tabs.tsx
│   │       └── step-navigation.tsx
│   ├── engine/                         # Pure TypeScript calculation engine
│   │   ├── discount.ts
│   │   ├── energy.ts
│   │   ├── maintenance.ts
│   │   ├── aggregate.ts
│   │   ├── residual.ts
│   │   ├── income.ts                   # METHOD_IMPROVEMENT: payback, NPV
│   │   ├── types.ts
│   │   ├── index.ts
│   │   ├── constants.ts                # EN 15459 data, energy sources
│   │   ├── validation.ts               # Input validation rules
│   │   └── FORMULAS.md
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── router.ts
│   │   │   ├── context.ts
│   │   │   ├── trpc.ts
│   │   │   └── routers/
│   │   │       ├── project.ts
│   │   │       ├── variant.ts
│   │   │       ├── cost-item.ts
│   │   │       ├── calculate.ts
│   │   │       ├── export.ts
│   │   │       └── reference.ts
│   │   ├── export/
│   │   │   ├── pdf-generator.ts
│   │   │   └── excel-generator.ts
│   │   └── auth/
│   │       └── auth.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── trpc-client.ts
│   │   ├── utils.ts
│   │   ├── animations.ts              # Framer Motion presets + useReducedMotion
│   │   └── validators.ts              # Zod schemas shared FE/BE
│   └── hooks/
│       ├── use-project.ts
│       ├── use-variant.ts
│       └── use-autosave.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/                     <- COMMITTED, not gitignored
├── tests/
│   ├── engine/
│   │   ├── discount.test.ts
│   │   ├── energy.test.ts
│   │   ├── maintenance.test.ts
│   │   ├── aggregate.test.ts
│   │   ├── residual.test.ts
│   │   ├── income.test.ts
│   │   └── integration.test.ts
│   └── fixtures/
│       └── excel-reference.json
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── package.json
├── vitest.config.ts
└── README.md
```

### 0.2 Initialize the project

```bash
cd C:\llc-calculator-app

npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

# Core dependencies
npm install @prisma/client @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod superjson next-auth@beta @auth/prisma-adapter

# UI
npm install recharts react-number-format lucide-react class-variance-authority clsx tailwind-merge tailwindcss-animate framer-motion

# Export
npm install exceljs @react-pdf/renderer sharp

# Dev dependencies
npm install -D prisma vitest @vitejs/plugin-react tsx @types/node

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Initialize shadcn/ui
npx shadcn@latest init

# shadcn components
npx shadcn@latest add button card input label select tabs dialog dropdown-menu toast separator badge sheet form table skeleton
```

### 0.3 Create .gitignore

```gitignore
node_modules/
.next/
out/
.env
.env.local
.env.production
.vscode/
.idea/
.DS_Store
Thumbs.db
coverage/
dist/
build/
exports/

# Reference files (large binaries, not tracked)
CRAVEzero/*.xlsm
CRAVEzero/*.docx
```

**NOTE:** `prisma/migrations/` is NOT gitignored. Migrations are source code.

### 0.4 Create .env.example

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lcczero?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
EXPORT_DIR="./exports"
```

### 0.5 Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 0.6 Add scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### 0.7 Create README.md

```markdown
# LCCzero — Life-Cycle Cost Analysis Platform

Web application for Life-Cycle Cost analysis of nZEB buildings.
Replaces the CRAVEzero Excel tool (ISO 15686-5:2017, EN 15459:2018).

## Repository

https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git

## Setup

npm install
cp .env.example .env.local   # edit with your DB credentials
npx prisma migrate dev
npm run db:seed
npm run dev

## Reference Files

Original CRAVEzero Excel tool and documentation must be present locally in `CRAVEzero/`.
These files are required for formula validation but are not tracked in git.

## Stack

Next.js 14 · TypeScript · PostgreSQL · Prisma · tRPC · Auth.js · Recharts · shadcn/ui · Framer Motion · Tailwind CSS (glass morphism)
```

### 0.8 Create docs/ placeholder files

Create empty `docs/excel-audit.md`, `docs/formula-map.md`, and `docs/decisions.md` with headers only. These will be populated in TASK 1.

### 0.9 Initial commit and push

```bash
git add .
git commit -m "chore: project scaffolding"
git push -uf origin main
```

---

## TASK 1: Excel Workbook Audit

**Do NOT write engine code until this task is complete.**

### 1.1 Create audit scripts

Create `scripts/extract_excel_formulas.py` using Python + openpyxl.

This script must:
1. Open `C:\llc-calculator-app\CRAVEzero\200512_LCC_tool_beta_v2.xlsm`
2. For each sheet (Project Information, WLC, Construction cost, Maintenance, Results, Calc, Charts):
   - Dump all non-empty cells with their formulas (not just values)
   - Record cell coordinates, formula text, and any named ranges
3. Output to `docs/excel-raw-dump.md` or `.json`

Create `scripts/extract_lookup_tables.py` that extracts:
1. EN 15459 table: Calc!B404:H483 — all component names, lifespans, maintenance percentages (exact values, not approximations)
2. Energy source list: Project Information rows 131-154 — names and order
3. Output structured JSON to `scripts/output/en15459.json` and `scripts/output/energy_sources.json`

**Run both scripts and commit the outputs.** These become the verified reference for engine constants.

### 1.2 Populate docs/excel-audit.md

After running the scripts, document:

1. **Sheet structure**: what each sheet does, row ranges, column layout
2. **Variant column mapping**: base case uses columns D/F/G (PI), variant 1 uses J/L/M, variant 2 uses P/R/S. Construction cost: base=cols T/AG/AU (total AZ), V1=BH/BS/CF (total CV), V2=DD/DO/EB (total ER). Document all column offsets.
3. **Discounting conventions**: where real rate is used vs nominal rate (critical asymmetry: energy uses RR, maintenance uses Rint — verify this by inspecting the actual formulas)
4. **Year indexing**: where year 0 starts, where year 1 starts, what is discounted at year 0 (should be discount factor = 1.0)
5. **Interest rate storage**: Calc!C3 stores 151 (basis points). PI!D121 = `Calc!C3/10000` = 0.0151 (decimal). The UX must accept percentage input (1.51%) and convert to decimal internally.
6. **Energy calculation flow**: for each end-use, trace the chain from price -> escalation -> nominal cost -> actualized -> cumulated. Document that:
   - Heating, Cooling, DHW: **2 systems each** (system 1 + system 2 summed before discounting)
   - Household electricity: **1 system only** (Calc rows 24-27)
   - PV production: **1 system only** (Calc rows 28-31), escalation uses PI!G143 directly (not via general INDEX)
7. **Calc aggregation rows (88-98)**: document the bridge between energy/maintenance modules and Results:
   - Row 89: `Energy consumed = cumulated(heating_act + cooling_act + DHW_act + household_act)`
   - Row 90: `Energy produced = cumulated(PV_act)`
   - Row 91-92: cumulated versions (running sums)
   - Row 93: `Maintenance TOT = row95 + row97`
   - Row 95: `Maintenance building elements = Maintenance!I64` (shifts by column per year)
   - Row 97: `Maintenance building services = Maintenance!I65`
   - Row 94, 96, 98: cumulated versions
8. **Maintenance logic**: building elements (flat annual %) vs building services (with replacement spikes). Replacement is capped at 3 cycles (IF(OR(year=1x, 2x, 3x lifespan))). Document **category-to-maintenance mapping**:
   - Categories A1-A10 (building elements) -> flat % maintenance, no replacement
   - Categories B1-B6, C1-C3 (building services + RES) -> EN 15459 lookup, with replacement
   - Categories D1, E1 -> no maintenance applied
9. **Known bugs**: document Maintenance row 62 formula error (`^(I)` instead of `^(I5)`) and any other issues found
10. **Residual value status**: Column BC in Construction cost has header "RESIDUAL VALUE" but **all formula cells are empty**. Results sheet does not reference residual value. This feature was planned but not implemented in the Excel workbook.
11. **Income status**: PI rows 84-113 collect income data (rent, other income) but **no Results formula references income**. Data collection only, no calculation.
12. **Building site management vs design costs**: Results!B62 (LCC) = B57 (design) + B65 (construction) + B76 (O&M) + **B61 (building site)**. Design and building site are **separate LCC components** sourced from the WLC sheet. B57 sums design professional fees; B61 sums site management costs.
13. **Fragile references**: any Results formulas that reference broken or ambiguous cells
14. **Macros/buttons**: what VBA macros exist (the variant display buttons), whether they affect calculations
15. **Energy prices per-variant**: confirmed. Base uses PI cols F/G, Variant 1 uses L/M, Variant 2 uses R/S for energy price and annual increase. Note: Variant 2 consumption formulas reference `$L$131:$L$149` (Variant 1 prices) — possible Excel bug or intentional sharing.

### 1.3 Populate docs/formula-map.md

Create a table with one row per formula:

| ID | Name | Excel Sheet | Cell(s) | Formula Text | Inputs | Output | Mode | Notes |
|----|------|-------------|---------|-------------|--------|--------|------|-------|
| FIN-001 | Real interest rate | Project Info | D125 | `=(D121-D123)/(1+(D123/100))` | Rint, Ri | RR | REPLICA | Simplified Fisher, see audit |
| FIN-002 | Discount factor | Calc | D8 | `=(1/(1+'Project Information'!$D$125))^D7` | RR, year | PV factor | REPLICA | |
| NRG-001 | Energy price escalation | Calc | E9 | `=D9+(INDEX('PI'!$G$131:$G$149,source_idx)*D9)` | prev price, annual increase | new price | REPLICA | Compound growth: `price*(1+rate)` |
| NRG-002 | Annual nominal energy cost | Calc | D11 | `=(D9*'PI'!$G$160)+(D10*'PI'!$G$161)` | price x total_consumption | nominal cost | REPLICA | Two systems summed for heating/cooling/DHW |
| NRG-003 | Actualized energy cost | Calc | D12 | `=D11*D8` | nominal x PV factor | actualized cost | REPLICA | |
| NRG-004 | Cumulated energy cost | Calc | D13 | `=D12` / `=E13+F12` | running sum | cumulated cost | REPLICA | Year 1 = just that year |
| NRG-005 | Household electricity cost | Calc | D26 | `=D24*'PI'!$G$169` | price x consumption | nominal cost | REPLICA | Single system only (no system 2) |
| NRG-006 | PV production cost | Calc | D30 | `=D28*'PI'!$G$171` | PV price x production_kWh | nominal PV value | REPLICA | Single system. Price escalation uses PI!G143 directly, not general INDEX |
| NRG-007 | Total consumption (kWh) | Project Info | G160 | `=F160*$D$52` | specific_consumption x treated_floor_area | total_kWh | REPLICA | Converts kWh/m2 to kWh |
| MNT-001 | Building element maintenance | Maintenance | I7 | `=$G$7/((1+$D$5)^(I5))` | annual_maint / (1+Rint)^year | discounted_maint | REPLICA | Uses Rint, NOT RR |
| MNT-002 | Building element annual cost | Maintenance | G7 | `=constr_cost * maint_%` | construction_cost, PI!D175 | annual_maint | REPLICA | maint_% from PI row 175 |
| MNT-003 | Service component lookup | Maintenance | F37/H37 | `=INDEX(Calc!$H$404:$H$483,D37)` / `=INDEX(Calc!$E$404:$E$483,D37)` | EN15459 index | maint_%, lifespan | REPLICA | |
| MNT-004 | Building service maintenance | Maintenance | I37 | `=IF(OR(I5=$H$37,I5=($H$37*2),I5=($H$37*3)),($E$37/((1+$D$5)^(I5))),($G$37/((1+$D$5)^(I5))))` | year, lifespan, constr_cost, maint_cost | discounted_cost | REPLICA | Replacement if year = N x lifespan (max 3) |
| MNT-BUG-001 | Row 62 bug | Maintenance | I62 | `...^(I)` instead of `^(I5)` | -- | -- | BUG_FIX | Exponent missing year row reference. `I` treated as column ref or named range |
| CAL-001 | Energy consumed aggregation | Calc | E89 | `=E12+E17+E22+E26` | actualized heating+cooling+DHW+household | total_energy_consumed | REPLICA | Per-year actualized |
| CAL-002 | Energy produced aggregation | Calc | E90 | `=E30` | actualized PV | total_energy_produced | REPLICA | |
| CAL-003 | Cumulated energy consumed | Calc | D91 | `=D89` / `=D91+E89` | running sum of CAL-001 | cumulated_consumed | REPLICA | |
| CAL-004 | Cumulated energy produced | Calc | D92 | `=D90` / `=D92+E90` | running sum of CAL-002 | cumulated_produced | REPLICA | |
| CAL-005 | Maintenance total | Calc | D93 | `=D95+D97` | elements + services | total_maintenance | REPLICA | |
| CAL-006 | Maintenance elements bridge | Calc | D95 | `=Maintenance!I64` | Maintenance sheet total | elements_total | REPLICA | Shifts column per year |
| CAL-007 | Maintenance services bridge | Calc | D97 | `=Maintenance!I65` | Maintenance sheet total | services_total | REPLICA | |
| CAL-008 | Cumulated maintenance | Calc | D94 | `=D93` / `=D94+E93` | running sum of CAL-005 | cumulated_maintenance | REPLICA | |
| AGG-001 | Construction total per category | Results | F4-F53 | `=D+E` per row | materials + labor | construction_cost | REPLICA | |
| AGG-002 | Total materials | Results | B66 | sum of material columns | per-category materials | total_materials | REPLICA | |
| AGG-003 | Total labor | Results | B71 | sum of labor columns | per-category labor | total_labor | REPLICA | |
| AGG-004 | Construction total | Results | B65 | `=B66+B71` | materials + labor | total_construction | REPLICA | |
| AGG-005 | Non-construction costs | Results | B56 | `=WLC!G27+WLC!J27` | land+enabling+planning+support+finance | non_construction | REPLICA | WLC!G27=G12+G16+G20+G22+G23+G24+G26 |
| AGG-006 | Design costs total | Results | B57 | sum of WLC design rows | design professional fees | total_design | REPLICA | From WLC rows 33-72, preliminary+definitive+executive columns |
| AGG-007 | Building site management | Results | B61 | sum of WLC site mgmt | site management costs | total_site_mgmt | REPLICA | **Separate from design** in LCC formula |
| AGG-008 | O&M costs | Results | B76 | `=B77-B78+B80` | energy_consumed - energy_produced + maintenance | total_O_and_M | REPLICA | |
| AGG-009 | Energy consumed (at ref period) | Results | B77 | `=INDEX(Calc!C91:AQ91,'PI'!D119+1)` | cumulated energy at year N | energy_consumed_total | REPLICA | |
| AGG-010 | Energy produced (at ref period) | Results | B78 | `=INDEX(Calc!C92:AQ92,'PI'!D119+1)` | cumulated PV at year N | energy_produced_total | REPLICA | |
| AGG-011 | Maintenance (at ref period) | Results | B80 | `=INDEX(Calc!C94:AQ94,'PI'!D119+1)` | cumulated maintenance at year N | maintenance_total | REPLICA | |
| AGG-012 | LCC | Results | B62 | `=B57+B65+B76+B61` | design + construction + O&M + site_mgmt | LCC | REPLICA | Note: 4 components, site_mgmt is separate from design |
| AGG-013 | WLC | Results | B55 | `=B62+B56` | LCC + non-construction | WLC | REPLICA | |
| AGG-014 | KPI ratios | Results | B82-B85 | `=B57/B62`, `=B65/B62`, etc. | component / LCC | ratio | REPLICA | DC/LCC, CC/LCC, LC/LCC, OC/LCC |
| RES-001 | Residual value | -- | -- | Not in Excel | cost, lifespan, ref_period | residual | **METHOD_IMPROVEMENT** | ISO 15686-5. Excel has header but no formulas. Formula: `cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod`. Applied to B*/C* categories only. |
| INC-001 | Annual net income | -- | -- | Not in Excel | rents, taxes, other_income | net_annual_income | **METHOD_IMPROVEMENT** | `sum(rent*area*12 - taxes) + sum(other - taxes)` |
| INC-002 | Simple payback period | -- | -- | Not in Excel | LCC, annual_income | payback_years | **METHOD_IMPROVEMENT** | `LCC / net_annual_income` |
| INC-003 | NPV of income stream | -- | -- | Not in Excel | annual_income, RR, ref_period | NPV | **METHOD_IMPROVEMENT** | `sum(income / (1+RR)^year)` for year 1..N |

Complete this table by reading the actual formulas from the audit dump. Do not leave placeholders.

### 1.4 Populate docs/decisions.md

Document key decisions:

```markdown
# Architecture Decisions

## DEC-001: Numeric types
Prisma Decimal for all money/rates in DB. Standard JS number in engine with
controlled rounding at output. Rationale: building LCC precision requirements
are met by IEEE 754 double; Decimal in DB prevents accumulation across writes.

## DEC-002: Formula mode
Engine accepts a `formulaMode` parameter: 'excel_replica' | 'excel_bugfixed'.
Default: 'excel_bugfixed'. Every snapshot records the mode used.
Currently only MNT-BUG-001 differs between modes.

## DEC-003: Replacement cycle cap
Excel IF(OR()) checks only 1x, 2x, 3x lifespan. Engine implements generic
year % lifespan === 0 but adds a `maxReplacements` parameter (default 3) for
Excel compatibility. Documented as METHOD_IMPROVEMENT when maxReplacements
is removed.

## DEC-004: Year indexing
Year 0 = construction year, discount factor = 1.0.
Operational costs (energy, maintenance) start at year 1.
Verified against Calc!D7 (year 0) and energy cost rows starting from column E (year 1).

## DEC-005: Maintenance discount rate
Building elements: discounted with Rint (nominal interest rate).
Energy costs: discounted with RR (real interest rate).
This asymmetry exists in the Excel workbook and is replicated.
Verified: Maintenance!D5 refs 'PI'!D121 (Rint), Calc!D8 refs 'PI'!D125 (RR).

## DEC-006: Residual value (METHOD_IMPROVEMENT)
Excel workbook has "RESIDUAL VALUE" header in Construction cost column BC but
all formula cells are empty. Results sheet does not reference it.
We implement residual value per ISO 15686-5:
  residual = cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod
Applied only to building services (categories B*, C*) that have a defined lifespan.
Building elements (A*) use the reference period as lifespan, so residual = 0.
This is subtracted from LCC (reduces total cost).
Mode: METHOD_IMPROVEMENT. Documented in every snapshot.

## DEC-007: Income and profitability analysis (METHOD_IMPROVEMENT)
Excel collects income data (PI rows 84-113) but never uses it in any calculation.
We implement:
- Net annual income = sum(rent * area * 12 - taxes) + sum(other_income - taxes)
- Simple payback = LCC / net_annual_income (years)
- NPV of income = sum(net_annual_income / (1+RR)^year) for years 1..refPeriod
- Net present value = NPV_income - LCC
These are informational KPIs shown in Results, not part of WLC/LCC totals.
Mode: METHOD_IMPROVEMENT.

## DEC-008: Cost category to maintenance mapping
Categories A1-A10 = building elements -> flat % annual maintenance (PI!D175)
Categories B1-B6, C1-C3 = building services/RES -> EN 15459 lookup (lifespan, maint%)
Categories D1, E1 = furnishings/outdoor -> no maintenance
This mapping is hardcoded in the engine as a constant.

## DEC-009: Interest rate UX format
Excel stores rates as basis points in Calc (C3=151 for 1.51%) and converts
via PI!D121 = Calc!C3/10000. The web UI accepts percentage input (e.g., 1.51)
and converts to decimal (0.0151) before storing in DB and passing to engine.

## DEC-010: Building site management separation
In Results, LCC = design + construction + O&M + building_site_management.
Design costs (B57) and building site management (B61) are SEPARATE components.
Both come from the WLC sheet but are aggregated independently.
The engine returns both as distinct fields in LCCResult.
```

### 1.5 Commit

```bash
git add .
git commit -m "docs: TASK 1 — Excel workbook audit, formula map, architecture decisions"
git push origin main
```

---

## TASK 2: Prisma Schema

**Key changes from previous versions:**
- `Float` -> `Decimal` for all monetary values and rates
- Added `ProjectMember` for multi-user sharing
- Added `formulaMode` to snapshots
- `MaintenanceConfig` properly related to `Variant`
- Migrations are committed

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- AUTH --------------------------------------------------------

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  organization  String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  projects      Project[]
  memberships   ProjectMember[]
  accounts      Account[]
  sessions      Session[]
  snapshots     ResultSnapshot[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// --- PROJECT -----------------------------------------------------

enum BuildingUse {
  RESIDENTIAL_SINGLE
  RESIDENTIAL_MULTI
  OFFICE
  EDUCATION
  COMMERCIAL
  INDUSTRIAL
  OTHER
}

enum MemberRole {
  OWNER
  EDITOR
  VIEWER
}

model Project {
  id               String            @id @default(cuid())
  name             String
  country          String?
  region           String?
  city             String?
  location         String?
  author           String?
  buildingUse      BuildingUse       @default(RESIDENTIAL_MULTI)
  constructionYear Int?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  userId           String
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  variants         Variant[]
  members          ProjectMember[]
  snapshots        ResultSnapshot[]
  revisions        ProjectRevision[]
  exports          ExportRecord[]
  @@index([userId])
}

model ProjectMember {
  id        String     @id @default(cuid())
  projectId String
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      MemberRole @default(EDITOR)
  createdAt DateTime   @default(now())
  @@unique([projectId, userId])
  @@index([userId])
}

// --- VARIANT -----------------------------------------------------

enum VariantLabel {
  BASE
  VARIANT_1
  VARIANT_2
}

model Variant {
  id                 String              @id @default(cuid())
  label              VariantLabel
  description        String?
  projectId          String
  project            Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  geometry           Geometry?
  boundaryCondition  BoundaryCondition?
  energyInputs       EnergyInput[]
  costItems          CostItem[]
  serviceComponents  ServiceComponent[]
  wlcInput           WLCInput?
  designCosts        DesignCost[]
  incomeInput        IncomeInput?
  maintenanceConfig  MaintenanceConfig?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  @@unique([projectId, label])
  @@index([projectId])
}

// --- GEOMETRY ----------------------------------------------------
// Excel: "Project Information" rows 23-70

model Geometry {
  id                    String   @id @default(cuid())
  variantId             String   @unique
  variant               Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  // Heated areas
  grossFloorArea        Decimal? @db.Decimal(14,2)  // m2 -- row 25
  netFloorArea          Decimal? @db.Decimal(14,2)  // m2 -- row 27
  grossVolume           Decimal? @db.Decimal(14,2)  // m3 -- row 29
  netVolume             Decimal? @db.Decimal(14,2)  // m3 -- row 31
  // Unheated areas
  unheatedGFA           Decimal? @db.Decimal(14,2)  // m2 -- row 35
  unheatedNFA           Decimal? @db.Decimal(14,2)  // m2 -- row 37
  unheatedGrossVol      Decimal? @db.Decimal(14,2)  // m3 -- row 39
  unheatedNetVol        Decimal? @db.Decimal(14,2)  // m3 -- row 41
  // Other areas
  balconiesArea         Decimal? @db.Decimal(14,2)  // m2 -- row 45
  otherSurfacesArea     Decimal? @db.Decimal(14,2)  // m2 -- row 48
  // Energy calculation data
  treatedFloorArea      Decimal? @db.Decimal(14,2)  // m2 (PHPP) -- row 52. THE normalization denominator
  windowArea            Decimal? @db.Decimal(14,2)  // m2 -- row 54
  totalThermalEnvelope  Decimal? @db.Decimal(14,2)  // m2 -- row 56
  // Indicators (informational, not used in LCC calc)
  avgUvalueOpaque       Decimal? @db.Decimal(8,4)   // W/(m2K) -- row 62
  avgUvalueGlazing      Decimal? @db.Decimal(8,4)   // W/(m2K) -- row 64
  avgHeatRecovery       Decimal? @db.Decimal(6,2)   // % -- row 66
  airTightness          Decimal? @db.Decimal(8,4)   // m3/(m2h) -- row 68
  pvInstalledCapacity   Decimal? @db.Decimal(12,2)  // Wp -- row 70
  // Cost check
  manualDesignConstructionCost Decimal? @db.Decimal(14,2) // EUR -- row 74
}

// --- BOUNDARY CONDITIONS -----------------------------------------
// Excel: "Project Information" rows 115-154

model BoundaryCondition {
  id               String   @id @default(cuid())
  variantId        String   @unique
  variant          Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  stakeholderRole  Int?     @default(1)
  referencePeriod  Int      @default(40)           // years -- row 119
  interestRate     Decimal  @default(0.0151) @db.Decimal(10,8)  // row 121 (stored as decimal, UI shows %)
  inflationRate    Decimal  @default(0.0056) @db.Decimal(10,8)  // row 123 (stored as decimal, UI shows %)
  // realInterestRate is CALCULATED by engine (FIN-001)
  energyPrices     Json     @default("[]")  // [{index, name, pricePerKwh, annualIncrease}] -- per-variant (verified)
}

// --- ENERGY INPUT ------------------------------------------------
// Excel: "Project Information" rows 156-171

enum EndUse {
  HEATING_1
  HEATING_2
  COOLING_1
  COOLING_2
  DHW_1
  DHW_2
  HOUSEHOLD_ELECTRICITY
  PV_PRODUCTION
}

model EnergyInput {
  id                  String   @id @default(cuid())
  variantId           String
  variant             Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  endUse              EndUse
  energySourceIndex   Int      @default(1)          // 1-19 index into energy source table
  specificConsumption Decimal? @db.Decimal(12,4)     // kWh/m2 (multiplied by treatedFloorArea in engine)
  pvProductionKwh     Decimal? @db.Decimal(14,2)     // kWh absolute (PV_PRODUCTION only)
  @@unique([variantId, endUse])
  @@index([variantId])
}

// --- CONSTRUCTION COSTS ------------------------------------------
// Excel: "Construction cost" sheet

enum CostCategory {
  // Building Elements (A) -- flat % maintenance, no replacement
  A1_ROOFS
  A2_FACADES
  A3_FLOORS
  A4_WALLS
  A5_WINDOWS
  A6_SHADING
  A7_DOORS
  A8_INTERNAL
  A9_STRUCTURE
  A10_OTHER
  // Building Services (B) -- EN 15459 lookup, with replacement
  B1_HEATING
  B2_COOLING
  B3_VENTILATION
  B4_HVAC_COMBINED
  B5_ELECTRICAL
  B6_HYDRAULIC
  // Renewable Energy Systems (C) -- EN 15459 lookup, with replacement
  C1_SOLAR_THERMAL
  C2_PV
  C3_OTHER_RES
  // Furnishings (D) -- no maintenance
  D1_FURNISHINGS
  // Outdoor (E) -- no maintenance
  E1_OUTDOOR
}

model CostItem {
  id              String           @id @default(cuid())
  variantId       String
  variant         Variant          @relation(fields: [variantId], references: [id], onDelete: Cascade)
  category        CostCategory
  subcategory     String?
  description     String?
  materialCostAgg Decimal?         @default(0) @db.Decimal(14,2)
  laborCostAgg    Decimal?         @default(0) @db.Decimal(14,2)
  otherCostAgg    Decimal?         @default(0) @db.Decimal(14,2)
  details         CostItemDetail[]
  @@index([variantId, category])
}

model CostItemDetail {
  id           String    @id @default(cuid())
  costItemId   String
  costItem     CostItem  @relation(fields: [costItemId], references: [id], onDelete: Cascade)
  layerOrder   Int       @default(0)
  description  String?
  area         Decimal?  @db.Decimal(14,2)    // m2
  materialCost Decimal?  @db.Decimal(14,2)    // EUR aggregated
  unitPrice    Decimal?  @db.Decimal(10,4)    // EUR/m2
  laborCost    Decimal?  @db.Decimal(14,2)
  otherCost    Decimal?  @db.Decimal(14,2)
  // effectiveMaterialCost = MAX(materialCost, unitPrice x area)
  // Replicates Excel: =IF(L>(O*F), L, F*O)
  @@index([costItemId])
}

// --- BUILDING SERVICES (maintenance) -----------------------------
// Excel: "Maintenance" rows 37-62

model ServiceComponent {
  id                    String   @id @default(cuid())
  variantId             String
  variant               Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  name                  String
  constructionCost      Decimal  @default(0) @db.Decimal(14,2)
  en15459ComponentIndex  Int      @default(1)
  // lifespan and maintenance% looked up from constants via this index
  @@index([variantId])
}

// --- WLC INPUT ---------------------------------------------------
// Excel: "WLC" rows 2-27

model WLCInput {
  id                  String   @id @default(cuid())
  variantId           String   @unique
  variant             Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  landArea            Decimal? @db.Decimal(14,2)
  buildingIndex       Decimal? @db.Decimal(8,4)
  floorHeight         Decimal? @db.Decimal(6,2)
  landPrice           Decimal? @db.Decimal(10,2)
  enablingCost1       Decimal? @default(0) @db.Decimal(14,2)
  enablingCost2       Decimal? @default(0) @db.Decimal(14,2)
  planningFees1       Decimal? @default(0) @db.Decimal(14,2)
  planningFees2       Decimal? @default(0) @db.Decimal(14,2)
  userSupportPropMgmt Decimal? @default(0) @db.Decimal(14,2)
  userSupportCharges  Decimal? @default(0) @db.Decimal(14,2)
  userSupportAdmin    Decimal? @default(0) @db.Decimal(14,2)
  financeCost         Decimal? @default(0) @db.Decimal(14,2)
}

// --- DESIGN COSTS ------------------------------------------------
// Excel: "WLC" rows 29-84

model DesignCost {
  id                 String   @id @default(cuid())
  variantId          String
  variant            Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  lineNumber         Int
  description        String
  preliminaryCost    Decimal? @default(0) @db.Decimal(14,2)
  definitiveCost     Decimal? @default(0) @db.Decimal(14,2)
  executiveCost      Decimal? @default(0) @db.Decimal(14,2)
  siteManagementCost Decimal? @default(0) @db.Decimal(14,2)
  @@index([variantId])
}

// --- INCOME ------------------------------------------------------
// Excel: "Project Information" rows 84-113

model IncomeInput {
  id                 String   @id @default(cuid())
  variantId          String   @unique
  variant            Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  rent1MonthlyPerM2  Decimal? @db.Decimal(10,2)
  rent1Area          Decimal? @db.Decimal(14,2)
  rent1Taxes         Decimal? @db.Decimal(14,2)
  rent2MonthlyPerM2  Decimal? @db.Decimal(10,2)
  rent2Area          Decimal? @db.Decimal(14,2)
  rent2Taxes         Decimal? @db.Decimal(14,2)
  rent3MonthlyPerM2  Decimal? @db.Decimal(10,2)
  rent3Area          Decimal? @db.Decimal(14,2)
  rent3Taxes         Decimal? @db.Decimal(14,2)
  otherIncome1       Decimal? @db.Decimal(14,2)
  otherIncome1Taxes  Decimal? @db.Decimal(14,2)
  otherIncome2       Decimal? @db.Decimal(14,2)
  otherIncome2Taxes  Decimal? @db.Decimal(14,2)
  otherIncome3       Decimal? @db.Decimal(14,2)
  otherIncome3Taxes  Decimal? @db.Decimal(14,2)
  expectedPricePerM2 Decimal? @db.Decimal(10,2)
}

// --- MAINTENANCE CONFIG ------------------------------------------
// Excel: "Project Information" row 175

model MaintenanceConfig {
  id                                String  @id @default(cuid())
  variantId                         String  @unique
  variant                           Variant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  buildingElementMaintenancePercent Decimal @default(0.01) @db.Decimal(8,6)
}

// --- SNAPSHOTS & VERSIONING --------------------------------------

enum FormulaMode {
  EXCEL_REPLICA
  EXCEL_BUGFIXED
}

model ResultSnapshot {
  id            String       @id @default(cuid())
  projectId     String
  project       Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  variantLabel  VariantLabel
  engineVersion String                          // e.g. "1.0.0"
  formulaMode   FormulaMode  @default(EXCEL_BUGFIXED)
  inputs        Json                            // full input state
  inputsHash    String?                         // checksum for reproducibility
  outputs       Json                            // full result object
  trigger       String                          // "export_pdf", "export_xlsx", "manual_lock"
  createdAt     DateTime     @default(now())
  createdById   String?
  createdBy     User?        @relation(fields: [createdById], references: [id])
  exportRecords ExportRecord[]
  @@index([projectId])
}

model ProjectRevision {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  label       String
  note        String?
  snapshotIds String[]
  createdAt   DateTime @default(now())
  @@index([projectId])
}

model ExportRecord {
  id         String          @id @default(cuid())
  projectId  String
  project    Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  format     String
  snapshotId String?
  snapshot   ResultSnapshot? @relation(fields: [snapshotId], references: [id])
  fileUrl    String?
  fileName   String?
  createdAt  DateTime        @default(now())
  @@index([projectId])
}
```

After creating the schema:
```bash
npx prisma migrate dev --name init
npx prisma generate
git add .
git commit -m "feat: TASK 2 — Prisma schema with Decimal types, multi-user, formula mode"
git push origin main
```

---

## TASK 3: Engine Types & Constants

### 3.1 Create `src/engine/types.ts`

```typescript
export const ENGINE_VERSION = "1.0.0";

export type FormulaMode = 'excel_replica' | 'excel_bugfixed';

export interface EngineConfig {
  formulaMode: FormulaMode;
  maxReplacementCycles: number;  // default 3 for Excel compat, Infinity for generic
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  formulaMode: 'excel_bugfixed',
  maxReplacementCycles: 3,
};

// --- Category-to-maintenance mapping (DEC-008)
export type MaintenanceType = 'building_element' | 'building_service' | 'none';

export const CATEGORY_MAINTENANCE_MAP: Record<string, MaintenanceType> = {
  A1_ROOFS: 'building_element',
  A2_FACADES: 'building_element',
  A3_FLOORS: 'building_element',
  A4_WALLS: 'building_element',
  A5_WINDOWS: 'building_element',
  A6_SHADING: 'building_element',
  A7_DOORS: 'building_element',
  A8_INTERNAL: 'building_element',
  A9_STRUCTURE: 'building_element',
  A10_OTHER: 'building_element',
  B1_HEATING: 'building_service',
  B2_COOLING: 'building_service',
  B3_VENTILATION: 'building_service',
  B4_HVAC_COMBINED: 'building_service',
  B5_ELECTRICAL: 'building_service',
  B6_HYDRAULIC: 'building_service',
  C1_SOLAR_THERMAL: 'building_service',
  C2_PV: 'building_service',
  C3_OTHER_RES: 'building_service',
  D1_FURNISHINGS: 'none',
  E1_OUTDOOR: 'none',
};

// --- Energy system counts per end-use
// Heating, Cooling, DHW: 2 systems each (summed before discounting)
// Household electricity: 1 system only
// PV production: 1 system only (escalation uses PI!G143 directly, not INDEX)
export const END_USE_PAIRS: [string, string | null][] = [
  ['HEATING_1', 'HEATING_2'],
  ['COOLING_1', 'COOLING_2'],
  ['DHW_1', 'DHW_2'],
  ['HOUSEHOLD_ELECTRICITY', null],    // single system
];
// PV_PRODUCTION handled separately (subtracted, not added)

export interface EnergySourcePrice {
  index: number;       // 1-19
  name: string;
  pricePerKwh: number;
  annualIncrease: number;  // decimal (0.015 = 1.5%)
}

export interface EnergyEndUseInput {
  endUse: string;
  energySourceIndex: number;
  specificConsumption: number;  // kWh/m2
  pvProductionKwh?: number;    // kWh absolute (PV only)
}

export interface ServiceComponentInput {
  name: string;
  constructionCost: number;
  en15459ComponentIndex: number;
}

export interface CostItemInput {
  category: string;
  materialCost: number;
  laborCost: number;
  otherCost: number;
}

export interface DesignCostInput {
  lineNumber: number;
  description: string;
  preliminaryCost: number;
  definitiveCost: number;
  executiveCost: number;
  siteManagementCost: number;
}

export interface IncomeInputData {
  rents: { monthlyPerM2: number; area: number; taxes: number }[];
  otherIncomes: { amount: number; taxes: number }[];
  expectedPricePerM2?: number;
}

export interface WLCInputData {
  landCost: number;            // landArea * buildingIndex * floorHeight * landPrice
  enablingCosts: number;       // sum of enabling cost columns
  planningFees: number;        // sum of planning fee columns
  userSupportPropMgmt: number;
  userSupportCharges: number;
  userSupportAdmin: number;
  financeCost: number;
  // Design costs are pre-aggregated into two separate totals:
  designCostsTotal: number;         // AGG-006: sum(preliminary + definitive + executive) across all lines
  siteManagementCostsTotal: number; // AGG-007: sum(siteManagementCost) across all lines -- SEPARATE from design
}

export interface VariantInput {
  // Financial
  referencePeriod: number;
  interestRate: number;      // decimal (0.0151 = 1.51%)
  inflationRate: number;     // decimal (0.0056 = 0.56%)
  // Geometry
  treatedFloorArea: number;  // m2 -- THE normalization denominator
  // Energy
  energyPrices: EnergySourcePrice[];
  energyInputs: EnergyEndUseInput[];
  // Construction
  costItems: CostItemInput[];
  serviceComponents: ServiceComponentInput[];
  // Maintenance
  buildingElementMaintenancePercent: number; // decimal (0.01 = 1%)
  // WLC
  wlcInput: WLCInputData;
  designCosts: DesignCostInput[];
  // Income (METHOD_IMPROVEMENT)
  incomeInput?: IncomeInputData;
}

// --- Year-by-year arrays for time series output
export interface YearlyEnergyCosts {
  nominal: number[];     // year 0..N
  actualized: number[];
  cumulated: number[];
}

export interface LCCResult {
  engineVersion: string;
  formulaMode: FormulaMode;

  // Financial
  realInterestRate: number;  // FIN-001

  // Energy breakdown (per end-use pair)
  heatingCosts: YearlyEnergyCosts;
  coolingCosts: YearlyEnergyCosts;
  dhwCosts: YearlyEnergyCosts;
  householdCosts: YearlyEnergyCosts;
  pvProduction: YearlyEnergyCosts;

  // Maintenance (discounted by Rint, NOT RR -- see DEC-005)
  maintenanceElements: number[];   // yearly discounted by Rint (nominal rate)
  maintenanceServices: number[];   // yearly discounted by Rint (includes replacement spikes)
  maintenanceTotal: number[];      // elements + services yearly
  maintenanceCumulated: number[];

  // Construction
  totalMaterials: number;
  totalLabor: number;
  totalConstruction: number;       // materials + labor
  constructionByCategory: Record<string, number>;

  // Aggregation (at reference period)
  nonConstructionCosts: number;    // AGG-005
  designCosts: number;             // AGG-006
  buildingSiteManagement: number;  // AGG-007 -- SEPARATE from design
  energyConsumed: number;          // AGG-009
  energyProduced: number;          // AGG-010
  maintenanceAtRefPeriod: number;  // AGG-011
  operationAndMaintenance: number; // AGG-008: consumed - produced + maintenance
  lcc: number;                     // AGG-012: design + construction + O&M + site
  wlc: number;                     // AGG-013: LCC + non-construction

  // Residual value (METHOD_IMPROVEMENT)
  residualValue: number;           // RES-001: subtracted from LCC
  lccNetResidual: number;          // LCC - residualValue

  // Income analysis (METHOD_IMPROVEMENT)
  income: {
    netAnnualIncome: number;       // INC-001
    simplePaybackYears: number | null; // INC-002 (null if income=0)
    npvIncomeStream: number;       // INC-003
    netPresentValue: number;       // NPV_income - LCC
  } | null;                        // null if no income data

  // KPIs
  kpiDesignOverLCC: number | null;
  kpiConstructionOverLCC: number | null;
  kpiLaborOverLCC: number | null;
  kpiOMOverLCC: number | null;
  kpiLCCPerM2: number | null;     // null if treatedFloorArea=0
  kpiWLCPerM2: number | null;
}
```

### 3.2 Create `src/engine/constants.ts`

**CRITICAL:** Use the exact values extracted by the audit scripts in TASK 1. Do not type these manually. Copy from `scripts/output/en15459.json` and `scripts/output/energy_sources.json`.

If TASK 1 scripts produced correct JSON, write a small script or manually transcribe the verified data into TypeScript constants. Every value must match the Excel Calc!B405:H483 table exactly.

### 3.3 Create `src/engine/validation.ts`

Input validation rules for the engine:

```typescript
export function validateVariantInput(input: VariantInput): string[] {
  const errors: string[] = [];
  if (input.referencePeriod <= 0) errors.push("Reference period must be > 0");
  if (input.referencePeriod > 100) errors.push("Reference period exceeds maximum (100 years)");
  if (input.interestRate < -0.1 || input.interestRate > 0.5) errors.push("Interest rate out of plausible range (-10% to 50%)");
  if (input.inflationRate < -0.1 || input.inflationRate > 0.5) errors.push("Inflation rate out of plausible range (-10% to 50%)");
  if (input.treatedFloorArea < 0) errors.push("Treated floor area cannot be negative");
  // treatedFloorArea = 0 is valid but KPIs will return null
  // ... validate energy source indexes exist (1-19)
  // ... validate no duplicate endUse per variant
  // ... validate EN 15459 component indexes exist
  // ... validate maintenance % >= 0
  // ... validate construction costs >= 0
  return errors;
}
```

### 3.4 Commit

```bash
git add .
git commit -m "feat: TASK 3 — engine types, constants from audit, input validation"
git push origin main
```

---

## TASK 4: Engine Implementation

Implement modules in this order: discount -> energy -> maintenance -> residual -> income -> aggregate -> index.

**For every module:** reference the formula IDs from `docs/formula-map.md`. Add inline comments with formula IDs.

### Implementation rules

1. **Maintenance uses Rint (nominal rate), NOT RR (real rate).** Energy uses RR. Verify against audit.
2. **Building service replacement:** `if (year > 0 && lifespan > 0 && year % lifespan === 0 && replacementCount < config.maxReplacementCycles)` -- then charge full construction cost instead of annual maintenance. Both discounted by `(1+Rint)^year`.
3. **MNT-BUG-001:** When `config.formulaMode === 'excel_replica'`, replicate the Excel bug in row 62. When `'excel_bugfixed'`, use the correct year reference. Document both paths.
4. **Energy end-use system counts:**
   - Heating, Cooling, DHW: **2 systems each**. System 1 + system 2 costs are summed into one annual cost before discounting.
   - Household electricity: **1 system only**. No system 2.
   - PV production: **1 system only**. Price escalation uses a **fixed energy source index** (not the configurable INDEX mechanism). PV is always subtracted, not added.
5. **PV is subtracted** from energy consumed in O&M: `O&M = energyConsumed - energyProduced + maintenance`.
6. **Discount factors:** year 0 = 1.0, year 1 = 1/(1+RR)^1, etc. Energy costs start at year 1.
7. **KPIs:** if treatedFloorArea is 0 or undefined, return `null` for per-m2 KPIs, not Infinity or NaN.
8. **No rounding in intermediate calculations.** Round only at the final output boundary (2 decimal places for EUR, 4 for rates).
9. **Building site management is a separate LCC component.** `LCC = design + construction + O&M + buildingSiteManagement`. Do NOT sum site management into design costs.
10. **Residual value** (METHOD_IMPROVEMENT): `cost * max(0, (lifespan - (refPeriod % lifespan)) / lifespan) / (1+RR)^refPeriod`. Applied to building services (B*, C*) only. Building elements use refPeriod as lifespan so residual=0. Subtracted from LCC.
11. **Income** (METHOD_IMPROVEMENT): `netAnnualIncome = sum(rent*area*12 - taxes) + sum(otherIncome - taxes)`. Payback = LCC/income. NPV = sum(income/(1+RR)^year). Optional — if no income data, skip.
12. **Cost aggregation strategy**: the engine receives **pre-aggregated costs** in CostItemInput (materialCost, laborCost, otherCost are already resolved). The detail-level `MAX(materialCost, unitPrice x area)` logic is resolved in the tRPC layer when mapping from DB to engine input. The engine does NOT process CostItemDetail records directly.
13. **FormulaMode conversion**: Prisma uses SCREAMING_CASE (`EXCEL_REPLICA`), engine uses lowercase (`'excel_replica'`). The tRPC calculate router converts between them.

### 4.1 `src/engine/discount.ts` -- FIN-001, FIN-002
### 4.2 `src/engine/energy.ts` -- NRG-001 through NRG-007
### 4.3 `src/engine/maintenance.ts` -- MNT-001 through MNT-004, MNT-BUG-001, CAL-005 through CAL-008
### 4.4 `src/engine/residual.ts` -- RES-001
### 4.5 `src/engine/income.ts` -- INC-001 through INC-003
### 4.6 `src/engine/aggregate.ts` -- AGG-001 through AGG-014, CAL-001 through CAL-004
### 4.7 `src/engine/index.ts` -- orchestrator

```typescript
import { VariantInput, LCCResult, EngineConfig, DEFAULT_ENGINE_CONFIG, ENGINE_VERSION } from './types';
import { validateVariantInput } from './validation';

export function calculateLCC(input: VariantInput, config: EngineConfig = DEFAULT_ENGINE_CONFIG): LCCResult {
  const errors = validateVariantInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid input: ${errors.join('; ')}`);
  }
  // 1. Real interest rate (FIN-001)
  // 2. Discount factors array (FIN-002)
  // 3. Energy projection per end-use pair (NRG-001..007)
  //    - Heating (sys1+sys2), Cooling (sys1+sys2), DHW (sys1+sys2)
  //    - Household (single), PV (single, subtracted)
  // 4. Energy aggregation (CAL-001..004)
  // 5. Maintenance: elements flat % + services with replacement (MNT-001..004)
  // 6. Maintenance aggregation (CAL-005..008)
  // 7. Construction aggregation by category (AGG-001..004)
  // 8. Non-construction + design + site management (AGG-005..007)
  // 9. O&M = energy net + maintenance (AGG-008..011)
  // 10. LCC = design + construction + O&M + site (AGG-012)
  // 11. WLC = non-construction + LCC (AGG-013)
  // 12. Residual value (RES-001, METHOD_IMPROVEMENT)
  // 13. Income analysis (INC-001..003, METHOD_IMPROVEMENT, optional)
  // 14. KPIs (AGG-014, with null-safe division)
  return { engineVersion: ENGINE_VERSION, formulaMode: config.formulaMode, /* ... */ };
}
```

### 4.8 Create `src/engine/FORMULAS.md`

Link every formula ID to its code location. Short developer reference.

### 4.9 Commit

```bash
git add .
git commit -m "feat: TASK 4 — calculation engine (discount, energy, maintenance, residual, income, aggregation)"
git push origin main
```

---

## TASK 5: Engine Tests

### 5.1 Create golden fixture

Open the Excel file. Populate a complete base case with realistic data. Record ALL values: yearly energy prices, yearly energy costs (nominal, actualized, cumulated), yearly maintenance costs, construction breakdown by category, LCC components, WLC, KPIs.

Save to `tests/fixtures/excel-reference.json`.

### 5.2 Unit tests

One test file per module. Each test uses values from the golden fixture. Tolerance: +/-0.01 EUR for intermediate values, exact match (after rounding to 2 decimals) for final totals.

- `tests/engine/discount.test.ts` -- FIN-001, FIN-002
- `tests/engine/energy.test.ts` -- NRG-001 through NRG-007
- `tests/engine/maintenance.test.ts` -- MNT-001 through MNT-004
- `tests/engine/aggregate.test.ts` -- AGG-001 through AGG-014, CAL-001 through CAL-008
- `tests/engine/residual.test.ts` -- RES-001 (no Excel reference, test against hand-calculated values)
- `tests/engine/income.test.ts` -- INC-001 through INC-003 (no Excel reference, test against hand-calculated values)

### 5.3 Integration test

`tests/engine/integration.test.ts`: feeds the full golden fixture input into `calculateLCC()` and validates every output field.

### 5.4 Formula mode test

Test that `calculateLCC(input, { formulaMode: 'excel_replica' })` produces the Excel-buggy value for MNT-BUG-001, and `excel_bugfixed` produces the corrected value.

### 5.5 Edge case tests

- `treatedFloorArea = 0` -- KPIs return null, no crash
- `referencePeriod = 1` -- minimal period
- No energy inputs -- energy costs = 0
- No service components -- service maintenance = 0
- No income data -- income analysis = null
- All zero costs -- LCC = 0, payback = null

### 5.6 Commit

```bash
git add .
git commit -m "test: TASK 5 — engine tests against Excel golden fixture"
git push origin main
```

---

## TASK 6: Database Seed

### 6.1 Create `prisma/seed.ts`

Seed script that creates:

1. **Demo user**: `demo@lcczero.dev` with hashed password `demo123`
2. **Demo project**: "CRAVEzero Reference Building" with realistic data matching the Excel tutorial
3. **Three variants**: BASE, VARIANT_1, VARIANT_2 with:
   - Geometry (from tutorial: GFA=2000m2, NFA=1800m2, treated=1750m2)
   - BoundaryCondition (interest=1.51%, inflation=0.56%, refPeriod=40, energy prices for common sources)
   - EnergyInputs (heating system 1+2, cooling, DHW, household, PV)
   - CostItems (at least one item per category A1-E1 with realistic values)
   - ServiceComponents (3-5 HVAC components with EN 15459 indexes)
   - WLCInput (land cost, enabling, planning fees)
   - DesignCosts (5-10 professional expert lines)
   - IncomeInput (1 rent stream for residential)
   - MaintenanceConfig (1% for building elements)
4. **ProjectMember** with OWNER role for demo user

### 6.2 Verify seed

```bash
npm run db:seed
npx prisma studio  # visual verification
```

### 6.3 Commit

```bash
git add .
git commit -m "feat: TASK 6 — database seed with demo project and realistic data"
git push origin main
```

---

## TASK 7: tRPC API

### 7.1 Setup tRPC

Create `src/server/trpc/trpc.ts` with:
- Base procedure with superjson transformer
- Protected procedure with auth check
- Context creation from NextAuth session

Create `src/server/trpc/context.ts` with Prisma client and session.

### 7.2 Create routers

**`src/server/trpc/routers/project.ts`:**
- `list` -- all projects where user is owner or member
- `getById` -- full project with variants (auth check: must be member)
- `create` -- new project + BASE variant + ProjectMember(OWNER)
- `update` -- project metadata
- `delete` -- cascade delete (OWNER only)
- `addMember` -- add ProjectMember (OWNER only)
- `removeMember` -- remove ProjectMember (OWNER only)

**`src/server/trpc/routers/variant.ts`:**
- `getByLabel` -- variant with all relations
- `upsertGeometry` -- create or update geometry
- `upsertBoundaryCondition` -- create or update boundary conditions
- `upsertEnergyInputs` -- batch upsert energy inputs
- `upsertWLCInput` -- create or update WLC input
- `upsertDesignCosts` -- batch upsert design cost lines
- `upsertIncomeInput` -- create or update income
- `upsertMaintenanceConfig` -- create or update maintenance config
- Authorization: check `ProjectMember.role >= EDITOR`

**`src/server/trpc/routers/cost-item.ts`:**
- `listByVariant` -- all cost items for a variant
- `upsert` -- create or update cost item with details
- `delete` -- remove cost item
- `batchUpsert` -- bulk update (for import)

**`src/server/trpc/routers/calculate.ts`:**
- `calculate` -- loads full variant data, maps to VariantInput, calls `calculateLCC()`, returns LCCResult
- `calculateAll` -- calculates all 3 variants for comparison view
- No auth mutation -- read-only computation

**`src/server/trpc/routers/reference.ts`:**
- `getEN15459Components` -- return EN 15459 lookup table from constants
- `getEnergySources` -- return energy source list from constants
- `getCostCategories` -- return CostCategory enum with labels and maintenance type

**`src/server/trpc/routers/export.ts`:**
- `exportPDF` -- generate PDF, create ResultSnapshot + ExportRecord
- `exportExcel` -- generate Excel (values only, no formulas), create ResultSnapshot + ExportRecord
- Both create a snapshot with `engineVersion`, `formulaMode`, `inputsHash`

### 7.3 Create root router

`src/server/trpc/router.ts` -- merge all sub-routers.

### 7.4 Create API route

`src/app/api/trpc/[trpc]/route.ts` -- Next.js App Router handler.

### 7.5 Create client

`src/lib/trpc-client.ts` -- React Query + tRPC client setup.

### 7.6 Commit

```bash
git add .
git commit -m "feat: TASK 7 — tRPC API with project, variant, calculation, export routers"
git push origin main
```

---

## TASK 8: Authentication

### 8.1 Setup Auth.js

Create `src/server/auth/auth.ts` with:
- Credentials provider (email + password)
- Prisma adapter for sessions
- JWT strategy
- Callbacks for session user enrichment

### 8.2 Create auth pages

**`src/app/(auth)/layout.tsx`:** centered card layout, no sidebar.

**`src/app/(auth)/login/page.tsx`:**
- Email + password form
- "Don't have an account? Register" link
- Error handling for invalid credentials

**`src/app/(auth)/register/page.tsx`:**
- Name, email, organization (optional), password, confirm password
- Password hashing with bcrypt
- Redirect to dashboard on success

### 8.3 Auth middleware

Protect all routes except `/`, `/login`, `/register`, `/api/auth/*`.
Redirect unauthenticated users to `/login`.

### 8.4 Commit

```bash
git add .
git commit -m "feat: TASK 8 — Auth.js credentials auth with login/register pages"
git push origin main
```

---

## TASK 9: UI Implementation

**Design system reference:** see "Design System" section above for colors, typography, glass morphism specs, animations, and accessibility requirements. All components in this task MUST follow those specifications.

### 9.0 Design system foundation

**`src/app/globals.css`:**
- Import Inter from `next/font/google` (configured in root layout)
- Tailwind base/components/utilities layers
- Custom utility classes for glass morphism: `.glass-card`, `.glass-input`
- CSS custom properties for the EURAC color palette

**`src/components/ui/glass-card.tsx`:**
- Reusable frosted glass container: `bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl`
- Props: `variant` (default | elevated | flat), `hover` (boolean), `className`
- Framer Motion `motion.div` with `scaleIn` animation on mount

**`src/components/ui/info-tooltip.tsx`:**
- `(i)` icon button with Radix tooltip
- Accessible: focusable, `aria-label`, keyboard dismissable
- Glass morphism tooltip panel

**`src/components/ui/slider-input.tsx`:**
- Combined slider + numeric input for percentage fields
- Synchronized bidirectional updates
- Used for: maintenance %, interest rate, inflation rate

**`src/components/ui/kpi-card.tsx`:**
- Large metric display: value (text-3xl font-bold), unit, label
- Optional trend indicator (up/down arrow with color)
- Glass card background with hover shadow transition
- Framer Motion `slideUp` stagger animation in grid

**`src/lib/animations.ts`:**
- Export `fadeIn`, `slideUp`, `scaleIn` animation presets
- Export `staggerContainer` for parent orchestration
- Export `useReducedMotion` hook wrapping Framer Motion's `useReducedMotion()`
- All motion components check reduced motion preference

### 9.1 Layout and navigation

**`src/app/layout.tsx`:**
- Inter font applied via `next/font/google`
- Glass morphism background: subtle gradient (`bg-gradient-to-br from-gray-50 to-gray-100`)
- Framer Motion `AnimatePresence` for page transitions

**`src/components/layout/app-sidebar.tsx`:**
- Glass card sidebar: `bg-white/70 backdrop-blur-md border-r border-white/20`
- Project list (from tRPC `project.list`) with hover states
- "New Project" button: primary style (`bg-[#C8102E]`)
- User menu (profile, logout) at bottom
- EURAC logo or LCCzero wordmark at top
- Responsive: sheet drawer on mobile, fixed sidebar on desktop

**`src/components/layout/step-navigation.tsx`:**
- 5-step progress: Info → WLC → Construction → Energy → Results
- Glass pill navigation with active state: `bg-primary text-white`
- Completed steps: checkmark icon, clickable
- Framer Motion `layoutId` for active indicator animation

**`src/components/layout/variant-tabs.tsx`:**
- Tabs: Base | Variant 1 | Variant 2
- Active variant: underline animation with `motion.div layoutId="activeTab"`
- Badge dot indicator for variants with data
- Glass background tab bar

### 9.2 Dashboard

**`src/app/dashboard/page.tsx`:**
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Project cards: GlassCard with name, building use icon, last modified, mini LCC bar
- "Create New Project" card: dashed border, `+` icon, primary color on hover
- Empty state: centered illustration, "No projects yet. Create your first LCC analysis."
- Framer Motion stagger animation on card load

### 9.3 Step 1 -- Project Info (`src/app/project/[id]/info/page.tsx`)

**`src/components/forms/project-info-form.tsx`:**
- Project metadata (name, location, building use, construction year)
- Geometry section: GlassCard with grouped fields in responsive grid
- Energy indicators section (U-values, air tightness, PV capacity) with InfoTooltip per field
- Cost check (manual design+construction cost for verification)
- Income section (3 rent streams + 3 other income sources) in collapsible GlassCard
- Autosave with 500ms debounce, indicator in header
- All inputs: glass style (`bg-white/60 rounded-xl focus:ring-primary/20`)

### 9.4 Step 2 -- WLC (`src/app/project/[id]/wlc/page.tsx`)

**`src/components/forms/wlc-form.tsx`:**
- Non-construction costs: GlassCard with labeled inputs
- Boundary conditions: GlassCard with SliderInput for rates
  - Interest rate (% input, stored as decimal) -- DEC-009
  - Inflation rate (% input, stored as decimal)
  - Reference period (years, number input)
  - Calculated real interest rate (read-only badge, computed live by engine FIN-001)
- Energy prices table: GlassCard with scrollable table, zebra rows
- Design costs table: dynamic rows, 4 cost columns, add/remove row buttons

### 9.5 Step 3 -- Construction (`src/app/project/[id]/construction/page.tsx`)

**`src/components/forms/construction-form.tsx`:**
- Accordion per CostCategory (A1..E1 with labels) inside GlassCard
- Each category: material cost (aggregated OR unit price × area), labor cost, other cost
- Detail expansion: Framer Motion `AnimatePresence` for smooth expand/collapse
- Service components section: name, construction cost, EN 15459 component dropdown with search

**`src/components/forms/cost-category-card.tsx`:**
- GlassCard with category header and colored left border:
  - Building elements (A*): `border-l-4 border-cyan-500`
  - Building services (B*, C*): `border-l-4 border-pink-500`
  - No maintenance (D*, E*): `border-l-4 border-gray-300`
- Summary row with total, expandable details

### 9.6 Step 4 -- Energy & Maintenance (`src/app/project/[id]/energy/page.tsx`)

**`src/components/forms/energy-form.tsx`:**
- Energy consumption table inside GlassCard:
  - Heating: system 1 + system 2 (energy source dropdown, kWh/m² input)
  - Cooling: system 1 + system 2
  - DHW: system 1 + system 2
  - Household electricity: single system
  - PV production: kWh absolute (highlighted in emerald)
- Maintenance config: SliderInput for building element maintenance %
- Preview: live-calculated annual energy costs in KPICard row

### 9.7 Step 5 -- Results (`src/app/project/[id]/results/page.tsx`)

- **KPI cards row**: `grid grid-cols-2 lg:grid-cols-4 gap-4`
  - LCC, WLC, LCC/m², payback period in KPICard components
  - Framer Motion stagger animation
- **Construction cost breakdown**: GlassCard table by category, materials vs labor
- **WLC/LCC breakdown**: GlassCard table with colored bars per component
- **O&M breakdown**: energy consumed, energy produced (PV in emerald), maintenance
- **Residual value**: highlighted line (METHOD_IMPROVEMENT badge)
- **Income analysis**: collapsible GlassCard (METHOD_IMPROVEMENT badge), net income, payback, NPV
- **KPI ratios**: horizontal bar indicators DC/LCC, CC/LCC, LC/LCC, OC/LCC
- **Variant comparison**: side-by-side GlassCards if multiple variants have data
- **Export buttons**: primary (PDF) + secondary (Excel) in top-right
- **Charts** (see 9.8)

### 9.8 Charts

All charts use Recharts with EURAC color palette and glass card containers.

**`src/components/charts/lcc-breakdown-chart.tsx`:**
- Stacked bar chart: WLC components (non-construction, design, construction, O&M, site)
- Colors: cyan, pink, amber, emerald, blue from domain accents
- One bar per variant for comparison
- Responsive: horizontal on mobile

**`src/components/charts/cost-evolution-chart.tsx`:**
- Line chart: cumulated costs over years (0..refPeriod)
- Lines: energy consumed (cyan), energy produced (emerald), maintenance (pink), total (gray-900)
- Smooth curves with dot markers at year milestones
- Tooltip: GlassCard style

**`src/components/charts/variant-comparison-chart.tsx`:**
- Grouped bar chart comparing LCC/WLC across variants
- Side-by-side bars for BASE, V1, V2
- EURAC red for BASE, amber for V1, blue for V2

### 9.9 UX details

- **Empty states**: centered icon + message in muted gray, e.g. "No service components added yet"
- **Loading**: glass morphism skeleton with shimmer animation
- **Autosave indicator**: pill badge in header — Saved (green) / Saving... (amber pulse) / Failed (red)
- **Validation feedback**: inline errors below fields in red-500, shake animation on submit with errors
- **Number formatting**: EUR with 2 decimals + `€` suffix, kWh with 1 decimal, percentages with 2 decimals
- **Page transitions**: Framer Motion `fadeIn` between steps, `slideUp` for section reveals
- **Toast notifications**: glass morphism toast for save confirmations, export completion

### 9.10 Commit

```bash
git add .
git commit -m "feat: TASK 9 — UI implementation (all steps, forms, charts, variant comparison)"
git push origin main
```

---

## TASK 10: Export

### 10.1 PDF Export (`src/server/export/pdf-generator.ts`)

Generate PDF report with:
- Project header (name, location, author, date)
- Variant label
- Construction cost breakdown table
- WLC/LCC summary table
- O&M breakdown
- Residual value
- Income analysis (if available)
- KPI indicators
- Charts (rendered as images)
- Footer: engine version, formula mode, timestamp

### 10.2 Excel Export (`src/server/export/excel-generator.ts`)

Generate Excel workbook (values only, no formulas) with:
- Sheet 1: Project Info + Boundary Conditions
- Sheet 2: Construction Costs (all categories, materials, labor)
- Sheet 3: Energy Costs (yearly breakdown)
- Sheet 4: Maintenance (yearly breakdown with replacement markers)
- Sheet 5: Results Summary (LCC, WLC, KPIs)
- Header row: "Generated by LCCzero v{version}, mode: {formulaMode}, date: {date}"

### 10.3 Snapshot creation

Every export:
1. Calls `calculateLCC()` to get fresh results
2. Creates a `ResultSnapshot` with:
   - `engineVersion`: current version
   - `formulaMode`: current mode
   - `inputs`: full serialized VariantInput
   - `inputsHash`: SHA-256 of serialized inputs
   - `outputs`: full LCCResult
   - `trigger`: "export_pdf" or "export_xlsx"
3. Creates an `ExportRecord` linked to the snapshot
4. Returns the file for download

### 10.4 Commit

```bash
git add .
git commit -m "feat: TASK 10 — PDF and Excel export with result snapshots"
git push origin main
```

---

## Key Reminders for the Agent

1. **Run TASK 1 (audit) before writing any engine code.** Inspect the workbook programmatically. Do not guess.

2. **Maintenance uses Rint. Energy uses RR.** This asymmetry is real and verified. Do not "normalize" it.

3. **The EN 15459 table must be extracted from the Excel file, not typed manually.** Use the audit script output.

4. **Formula mode** must be a parameter to the engine. Every snapshot records which mode was used.

5. **Hybrid construction cost:** if details exist, sum them. Within a detail: `effectiveMaterialCost = MAX(materialCost, unitPrice x area)`.

6. **Energy system counts vary by end-use.** Heating/Cooling/DHW: 2 systems summed. Household electricity: 1 system. PV: 1 system (subtracted). PV price escalation uses a fixed source, not the general INDEX.

7. **PV is subtracted.** `O&M = energyConsumed - energyProduced + maintenance`.

8. **Year 0 = construction, discount factor = 1.0.** Operational costs start year 1.

9. **treatedFloorArea = 0 -> KPIs return null**, not crash.

10. **Building site management is separate from design costs** in the LCC formula. `LCC = design + construction + O&M + site`.

11. **Residual value is a METHOD_IMPROVEMENT** (not in Excel). Subtracted from LCC. Applied to building services only.

12. **Income/payback/NPV is a METHOD_IMPROVEMENT** (not in Excel). Informational KPIs, not part of WLC/LCC totals.

13. **Category-to-maintenance mapping**: A* = building elements (flat %), B*/C* = building services (EN 15459), D*/E* = none.

14. **Interest rates**: stored as decimals (0.0151), displayed as percentages (1.51%) in UI.

15. **Commit and push after each TASK** to `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`. Format: `feat: TASK N — description`.

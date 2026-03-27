# Phase 8: UI Implementation - Research

**Researched:** 2026-03-27
**Domain:** Next.js App Router UI (forms, wizard, charts, glass morphism)
**Confidence:** HIGH

## Summary

Phase 8 implements the full user-facing UI: a 5-step wizard (Info, WLC, Construction, Energy, Results) with variant tabs, autosaving forms, a bento-grid results dashboard, and interactive charts. The existing codebase provides a solid foundation: 14 shadcn/ui components (base-nova style with @base-ui/react primitives), complete tRPC API layer (6 routers), glass morphism CSS utilities, EURAC color tokens, Inter font, and dark mode CSS variables. The main work is creating page routes, form components, chart wrappers, and a useAutosave hook.

The stack is fully determined: Next.js 15 App Router, React Hook Form 7 + Zod 4 + @hookform/resolvers for forms, Recharts 3 for charts, motion (Framer Motion) for animations, next-themes for dark mode, and shadcn/ui base-nova for the component library. All packages are already in package.json. The primary architectural challenge is the autosave pattern: combining react-hook-form's `useWatch` with debounced tRPC mutations while providing reliable save status feedback.

**Primary recommendation:** Use route groups to separate `(auth)` and `(app)` layouts. Build the wizard as URL-driven steps (`/projects/[id]/info`, `/projects/[id]/wlc`, etc.) with a shared project layout containing variant tabs and step navigation. Implement autosave with a custom `useAutosave` hook using `useWatch` + `setTimeout` debounce + tRPC `useMutation`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Free navigation: all 5 steps (Info, WLC, Construction, Energy, Results) accessible at any time, no sequential locking
- Variant tabs (Base, Variant 1, Variant 2) always visible across all steps
- Step completion shown with minimal progress dots: filled = completed, ring = current, empty = not visited
- Autosave feedback via status badge in header near project name: "Saved" (green), "Saving..." (gray pulse), "Failed" (red) -- always visible
- Construction step: 21 cost categories organized in accordion groups by phase (A1-A5, B1-B5, C1-C4, D1, E1). Expanding a category shows detail rows + "Add detail" button
- Form validation triggers on blur. Errors clear when user corrects the value
- EN 15459 service component selector: searchable combobox with type-ahead over 80+ HVAC components, showing component name + lifespan + maintenance %
- Bento-style dashboard grid mixing KPI cards (LCC, WLC, LCC/m2, payback), charts, and breakdown tables
- Variant comparison: side-by-side columns (Base, V1, V2) with KPIs and mini-charts per variant
- Chart interactivity: hover tooltips only, no zoom/click actions
- Auto-calculate: results computed automatically when user navigates to Results step, with loading skeleton during calculation
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Glass morphism design system with EURAC brand colors (#C8102E primary) | Existing `.glass`/`.glass-dark` utilities in globals.css; EURAC oklch tokens already in theme. GlassCard wraps shadcn Card with glass classes + subtle border |
| UI-02 | Inter font loaded via next/font/google (weights 300-700) | Already configured in `layout.tsx` with `--font-inter` variable and `font-sans` mapping |
| UI-03 | Responsive sidebar with project list and user menu | shadcn/ui Sidebar component available for base-nova style. SidebarProvider + collapsible icon mode for mobile |
| UI-04 | 5-step wizard navigation (Info, WLC, Construction, Energy, Results) | URL-driven steps with shared project layout. Step bar component with progress dots. Free navigation via links |
| UI-05 | Variant tabs (Base, Variant 1, Variant 2) with data indicator | shadcn/ui Tabs component (already installed). Tabs in project layout above step content |
| UI-06 | Custom components: GlassCard, InfoTooltip, SliderInput, KPICard | GlassCard = Card + glass class. InfoTooltip = Tooltip + info icon. SliderInput = Slider + NumericFormat. KPICard = Card with metric display |
| UI-07 | motion animations with prefers-reduced-motion respect | `motion` package (v12.38) already installed. Import from `motion/react`. Use `AnimatePresence` for step transitions, `motion.div` for accordions/charts |
| UI-08 | Project info form: metadata, geometry, energy indicators, income | React Hook Form + Zod schema. Fields from Project (name, city, etc.) + Geometry model + IncomeInput model |
| UI-09 | WLC form: non-construction costs, boundary conditions, SliderInput, energy prices, design costs | WLCInput + BoundaryCondition + DesignCost models. Energy prices as editable JSON table |
| UI-10 | Construction form: accordion per category, detail expansion, service components with EN 15459 dropdown | Accordion component + CostItem/CostItemDetail models. Combobox for EN 15459 search |
| UI-11 | Energy form: consumption table with system 1/2, PV, maintenance config | EnergyInput model (8 EndUse types). Table layout with NumericFormat inputs |
| UI-12 | Autosave with 500ms debounce and visual indicator | Custom `useAutosave` hook: useWatch + setTimeout(500) + tRPC useMutation. SaveStatus component in header |
| UI-13 | Inline validation feedback on form fields | React Hook Form mode: "onBlur" + Zod resolver. FieldError component renders below invalid fields |
| UI-14 | KPI cards: LCC, WLC, LCC/m2, payback period | KPICard custom component displaying LCCResult fields with currency/number formatting |
| UI-15 | Construction cost breakdown table by category | shadcn Table component. Data from `constructionByCategory` in LCCResult |
| UI-16 | WLC/LCC breakdown table with O&M detail | shadcn Table. Data from LCCResult aggregate fields |
| UI-17 | Variant comparison side-by-side view | CSS grid with 3 columns. `calculation.calculateAll` tRPC procedure for 3 variants |
| UI-18 | LCC breakdown stacked bar chart | Recharts BarChart with stackId. Series: design, construction, O&M, site management |
| UI-19 | Cost evolution line chart over reference period | Recharts LineChart with multiple Line components for cumulative series |
| UI-20 | Variant comparison grouped bar chart | Recharts BarChart without stackId. Grouped bars per variant |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.5.14 | App Router, SSR, file-based routing | Already installed. Layouts persist across navigation, route groups organize auth vs app |
| react-hook-form | ^7.72.0 | Form state management | Already installed. Performant (minimal re-renders), native useWatch for autosave |
| @hookform/resolvers | ^5.2.2 | Zod integration for RHF | Already installed. zodResolver bridges Zod schemas to RHF validation |
| zod | ^4.3.6 | Schema validation | Already installed. Zod 4 with `.error()` (replaces v3 `.message()`). Used at form boundary |
| recharts | ^3.8.1 | Chart rendering | Already installed. Declarative React components, built on D3, native SVG |
| motion | ^12.38.0 | Animations | Already installed. Import from `motion/react`. AnimatePresence for exit animations |
| next-themes | ^0.4.6 | Dark mode (system preference) | Already installed. enableSystem for prefers-color-scheme, no toggle needed |
| shadcn | ^4.1.0 | Component library CLI | Already installed. base-nova style with @base-ui/react primitives |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-number-format | ^5.4.5 | Currency/numeric inputs | Already installed. NumericFormat for monetary fields with thousand separators |
| lucide-react | ^1.7.0 | Icons | Already installed. ChevronRight, Info, Check, X, etc. |
| sonner | ^2.0.7 | Toast notifications | Already installed as shadcn component. Error toasts for failed saves |
| @tanstack/react-query | ^5.95.2 | Data fetching layer | Already installed. Powers tRPC queries/mutations. useSuspenseQuery for loading states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useAutosave | react-hook-form-autosave | External lib adds dependency for ~20 lines of custom code. Custom is simpler |
| URL-driven wizard steps | Client-side state wizard | URL-driven enables direct linking, browser back/forward, and SSR. Clearly better |
| Recharts | shadcn/ui charts (built on Recharts) | shadcn chart wrappers add abstraction but project already has Recharts directly. Use Recharts directly for control |

**Installation:**
```bash
# Additional shadcn components needed (not yet installed)
npx shadcn@latest add accordion combobox slider sidebar tooltip form popover command scroll-area number-field
```

## Architecture Patterns

### Recommended Project Structure
```
src/app/
├── (auth)/                    # Auth layout (no sidebar)
│   ├── layout.tsx             # Centered card layout
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/                     # App layout (sidebar + header)
│   ├── layout.tsx             # SidebarProvider + header + save status
│   ├── projects/
│   │   ├── page.tsx           # Project list
│   │   └── [id]/
│   │       ├── layout.tsx     # Variant tabs + step navigation
│   │       ├── info/page.tsx
│   │       ├── wlc/page.tsx
│   │       ├── construction/page.tsx
│   │       ├── energy/page.tsx
│   │       └── results/page.tsx
│   └── settings/page.tsx
├── api/
│   ├── auth/[...all]/route.ts  # (exists)
│   └── trpc/[...trpc]/route.ts # (exists)
├── layout.tsx                  # Root: html, body, TRPCReactProvider, ThemeProvider
├── globals.css                 # (exists)
└── page.tsx                    # Landing/redirect
src/components/
├── ui/                         # shadcn components (exists)
├── project/                    # Project-specific components
│   ├── wizard-steps.tsx        # Step navigation bar
│   ├── variant-tabs.tsx        # Variant tab switcher
│   ├── save-status.tsx         # Saved/Saving/Failed badge
│   └── project-sidebar.tsx     # Sidebar with project list
├── forms/                      # Form step components
│   ├── info-form.tsx
│   ├── wlc-form.tsx
│   ├── construction-form.tsx
│   ├── energy-form.tsx
│   └── shared/                 # Reusable form bits
│       ├── currency-input.tsx  # NumericFormat wrapper for RHF
│       ├── percent-input.tsx
│       └── en15459-combobox.tsx
├── results/                    # Results components
│   ├── kpi-card.tsx
│   ├── breakdown-table.tsx
│   ├── variant-comparison.tsx
│   └── charts/
│       ├── lcc-stacked-bar.tsx
│       ├── cost-evolution-line.tsx
│       └── variant-grouped-bar.tsx
└── shared/                     # Cross-cutting
    ├── glass-card.tsx
    ├── info-tooltip.tsx
    └── slider-input.tsx
src/hooks/
├── use-autosave.ts             # Debounced autosave with tRPC
├── use-save-status.ts          # Save status state machine
└── use-variant-data.ts         # Fetch variant data for current tab
```

### Pattern 1: URL-Driven Wizard with Shared Layout
**What:** Each wizard step is a separate page under `/projects/[id]/`. The project layout provides variant tabs and step navigation that persist across step changes.
**When to use:** Multi-step forms where users need free navigation, deep linking, and browser history.
**Example:**
```typescript
// src/app/(app)/projects/[id]/layout.tsx
"use client";
import { useParams, usePathname } from "next/navigation";
import { WizardSteps } from "@/components/project/wizard-steps";
import { VariantTabs } from "@/components/project/variant-tabs";
import { SaveStatus } from "@/components/project/save-status";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const currentStep = pathname.split("/").pop() ?? "info";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <WizardSteps projectId={id} currentStep={currentStep} />
        <SaveStatus />
      </div>
      <VariantTabs projectId={id}>
        {children}
      </VariantTabs>
    </div>
  );
}
```

### Pattern 2: Autosave with useWatch + Debounce
**What:** Custom hook that watches form values via `useWatch`, debounces changes, and fires a tRPC mutation. Exposes save status.
**When to use:** Every form step that needs autosave.
**Example:**
```typescript
// src/hooks/use-autosave.ts
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

export function useAutosave<T extends FieldValues>({
  control,
  mutationOptions,
  debounceMs = 500,
  enabled = true,
}: {
  control: Control<T>;
  mutationOptions: Parameters<typeof useMutation>[0];
  debounceMs?: number;
  enabled?: boolean;
}) {
  const values = useWatch({ control });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const mutation = useMutation(mutationOptions);
  const prevValues = useRef<string>("");

  const status: SaveStatus = mutation.isPending
    ? "saving"
    : mutation.isError
      ? "failed"
      : mutation.isSuccess
        ? "saved"
        : "idle";

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(values);
    if (serialized === prevValues.current) return;
    prevValues.current = serialized;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      mutation.mutate(values as any);
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [values, enabled, debounceMs]);

  return { status, retry: () => mutation.mutate(values as any) };
}
```

### Pattern 3: tRPC v11 Query/Mutation in Components
**What:** Use the new tRPC v11 TanStack React Query integration with `useTRPC()` hook to create query/mutation options.
**When to use:** All data fetching and mutations.
**Example:**
```typescript
// Queries
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";

function ProjectInfo({ variantId }: { variantId: string }) {
  const trpc = useTRPC();

  // Query with suspense (parent provides <Suspense> boundary)
  const { data } = useSuspenseQuery(
    trpc.variant.getGeometry.queryOptions({ variantId })
  );

  // Mutation
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.variant.upsertGeometry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getGeometry.queryKey({ variantId }),
        });
      },
    })
  );
}
```

### Pattern 4: NumericFormat + React Hook Form Integration
**What:** Wrap `react-number-format` NumericFormat as a controlled component for RHF via Controller.
**When to use:** All monetary/numeric form fields.
**Example:**
```typescript
// src/components/forms/shared/currency-input.tsx
"use client";
import { Controller, type Control } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

export function CurrencyInput({
  name,
  control,
  label,
}: {
  name: string;
  control: Control<any>;
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState }) => (
        <div>
          <label className="text-sm font-medium">{label}</label>
          <NumericFormat
            {...field}
            value={value}
            onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            customInput={Input}
            className={fieldState.invalid ? "border-destructive" : ""}
          />
          {fieldState.error && (
            <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
```

### Pattern 5: Recharts with ResponsiveContainer
**What:** Wrap all charts in ResponsiveContainer for responsive sizing. Use theme-aware colors.
**When to use:** All chart components.
**Example:**
```typescript
// src/components/results/charts/lcc-stacked-bar.tsx
"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import type { LCCResult } from "@/engine/types";

const CHART_COLORS = {
  design: "hsl(210, 40%, 60%)",
  construction: "hsl(160, 45%, 50%)",
  oAndM: "hsl(35, 80%, 55%)",
  siteManagement: "hsl(280, 35%, 55%)",
};

export function LCCStackedBar({ result }: { result: LCCResult }) {
  const data = [
    {
      name: "LCC Breakdown",
      design: result.designCosts,
      construction: result.totalConstruction,
      oAndM: result.operationAndMaintenance,
      siteManagement: result.buildingSiteManagement,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="design" stackId="lcc" fill={CHART_COLORS.design} name="Design" />
        <Bar dataKey="construction" stackId="lcc" fill={CHART_COLORS.construction} name="Construction" />
        <Bar dataKey="oAndM" stackId="lcc" fill={CHART_COLORS.oAndM} name="O&M" />
        <Bar dataKey="siteManagement" stackId="lcc" fill={CHART_COLORS.siteManagement} name="Site Mgmt" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Anti-Patterns to Avoid
- **Monolithic form component:** Don't put all 5 steps in one form. Each step is an independent form with its own schema, useForm, and autosave. Variant-level data changes independently.
- **Client-side wizard state:** Don't manage step navigation in React state. Use URL segments for free navigation, deep linking, and SSR compatibility.
- **Server components for forms:** Forms require interactivity. Mark form components `"use client"`. Keep page.tsx as thin server component that passes params to client form.
- **Polling for save status:** Don't poll the server to check if data was saved. The mutation's status (pending/success/error) IS the save status.
- **Inline tRPC calls in JSX:** Don't call tRPC hooks directly in JSX render. Extract data fetching to custom hooks or component top-level.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schemas + zodResolver | Type inference, composable, error messages, async validation |
| Numeric formatting | Regex-based formatters | react-number-format NumericFormat | Cursor positioning, paste handling, locale edge cases |
| Combobox/search | Custom dropdown + filter | shadcn Combobox component | Keyboard navigation, ARIA, scroll virtualization |
| Chart tooltips | Custom hover handlers | Recharts Tooltip component | Position calculation, boundary detection, theme integration |
| Dark mode detection | Custom matchMedia listener | next-themes with enableSystem | SSR hydration mismatch prevention, localStorage persistence |
| Sidebar collapse | Custom toggle + animation | shadcn Sidebar component | Mobile sheet, keyboard shortcut, cookie persistence |
| Animation orchestration | Manual CSS transitions | motion AnimatePresence + variants | Exit animations, layout animations, reduced-motion respect |

**Key insight:** Every "simple" UI behavior (combobox filtering, numeric input formatting, dark mode without flash) has edge cases that take days to handle correctly. The existing stack already includes solutions for all of them.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Dark Mode
**What goes wrong:** Server renders light theme, client detects dark preference, visible flash/error.
**Why it happens:** Server doesn't know user's color scheme preference.
**How to avoid:** Use `next-themes` ThemeProvider with `attribute="class"` and `enableSystem`. Add `suppressHydrationWarning` to `<html>` tag. Never conditionally render based on theme in server components.
**Warning signs:** React hydration warnings in console, flash of wrong theme on load.

### Pitfall 2: useWatch Triggering Infinite Save Loops
**What goes wrong:** Autosave fires, server returns updated data, form resets, useWatch detects "change", fires again.
**Why it happens:** No dirty-checking or value comparison before triggering mutation.
**How to avoid:** Compare serialized values with previous ref. Only trigger mutation when values actually changed. Don't reset form from server response if values haven't changed.
**Warning signs:** Network tab shows repeated identical mutations, save indicator never stops.

### Pitfall 3: Decimal Precision Loss in Forms
**What goes wrong:** User enters 0.0151 (interest rate), form stores 0.02 or loses trailing precision.
**Why it happens:** JavaScript floating-point arithmetic. Number inputs round to default precision.
**How to avoid:** Use `react-number-format` with explicit `decimalScale`. Server stores as Prisma Decimal. Client displays formatted string, submits float. Don't chain arithmetic on form values client-side.
**Warning signs:** Values change slightly after save-and-reload cycle.

### Pitfall 4: Stale Variant Data After Tab Switch
**What goes wrong:** User edits Variant 1, switches to Variant 2, switches back -- sees stale data.
**Why it happens:** React Query cache serves stale data; form `defaultValues` only set on mount.
**How to avoid:** Use `key={variantId}` on form components to force remount on variant switch. Or use `form.reset(newData)` in useEffect when variant data changes. Set reasonable `staleTime` (e.g., 30s).
**Warning signs:** Data doesn't update when switching variants, or previous variant's data flashes briefly.

### Pitfall 5: AnimatePresence Not Animating Exits in App Router
**What goes wrong:** Page transitions animate in but not out. Exit animations are skipped.
**Why it happens:** Next.js App Router unmounts pages immediately on navigation. AnimatePresence needs the old component to stay mounted during exit.
**How to avoid:** Use `template.tsx` instead of relying on layout for animation wrapping. Wrap page content (not `{children}` in layout) with AnimatePresence + `key={pathname}` inside a template file. Accept that full exit animations are unreliable in App Router -- use enter-only animations for page transitions, exit animations only for in-page elements (accordions, modals).
**Warning signs:** `mode="wait"` on AnimatePresence causes blank screen between pages.

### Pitfall 6: Large Bundle from Recharts
**What goes wrong:** Recharts imports add 200KB+ to client bundle.
**Why it happens:** Importing from `recharts` barrel export pulls in all chart types.
**How to avoid:** Import specific components: `import { BarChart, Bar } from "recharts"`. Recharts 3 supports tree-shaking, but verify with bundle analyzer. Lazy-load chart components since they only appear on Results step.
**Warning signs:** Large first-load JS in next build output.

## Code Examples

### Dark Mode Setup with next-themes
```typescript
// src/app/(app)/layout.tsx (or root layout)
import { ThemeProvider } from "next-themes";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

// src/app/layout.tsx -- add suppressHydrationWarning
<html lang="en" suppressHydrationWarning>
```

### GlassCard Component
```typescript
// src/components/shared/glass-card.tsx
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card/95 p-6 shadow-sm backdrop-blur-sm",
        "dark:bg-card/90 dark:border-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### Accordion Construction Categories
```typescript
// Pattern for Construction step
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const GROUPS = [
  { label: "Building Elements", categories: ["A1_ROOFS", "A2_FACADES", /* ... */] },
  { label: "Building Services", categories: ["B1_HEATING", /* ... */] },
  // ...
];

function ConstructionAccordions({ variantId }: { variantId: string }) {
  return (
    <Accordion type="multiple">
      {GROUPS.flatMap((group) =>
        group.categories.map((cat) => (
          <AccordionItem key={cat} value={cat}>
            <AccordionTrigger>{getCategoryLabel(cat)}</AccordionTrigger>
            <AccordionContent>
              <CostCategoryForm variantId={variantId} category={cat} />
            </AccordionContent>
          </AccordionItem>
        ))
      )}
    </Accordion>
  );
}
```

### EN 15459 Combobox
```typescript
// Pattern for searchable EN 15459 component selector
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { useTRPC } from "@/server/trpc/client";
import { useQuery } from "@tanstack/react-query";

function EN15459Combobox({ value, onChange }: { value: number; onChange: (index: number) => void }) {
  const trpc = useTRPC();
  const { data: components = [] } = useQuery(trpc.reference.en15459Components.queryOptions());

  const items = components.map((c) => ({
    value: String(c.index),
    label: `${c.name} (${c.lifespanAvg}yr, ${c.maintenancePctAvg ?? 0}%)`,
    ...c,
  }));

  return (
    <Combobox
      value={String(value)}
      onValueChange={(val) => onChange(Number(val))}
      items={items}
    >
      <ComboboxInput placeholder="Search HVAC component..." />
      <ComboboxContent>
        <ComboboxEmpty>No components found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
```

### SaveStatus Badge
```typescript
// src/components/project/save-status.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: { icon: Loader2, label: "Saving...", variant: "secondary" as const, className: "animate-pulse" },
    saved: { icon: Check, label: "Saved", variant: "secondary" as const, className: "text-green-600" },
    failed: { icon: AlertCircle, label: "Failed", variant: "destructive" as const, className: "" },
  };

  const { icon: Icon, label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
```

### Motion Page Transition (Enter Only)
```typescript
// src/app/(app)/projects/[id]/template.tsx
"use client";
import { motion } from "motion/react";

export default function ProjectTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, import from `motion/react` | 2025 | Same API, new package name. Project already uses `motion` |
| tRPC classic React hooks (`trpc.useQuery`) | tRPC v11 TanStack-native (`useTRPC()` + `useQuery(options)`) | 2024-2025 | More idiomatic, better React Compiler support. Project uses new API |
| Zod v3 `.message()` | Zod v4 `.error()` | 2025 | Error customization unified. Project uses Zod 4 |
| shadcn Radix-only | shadcn base-nova (Base UI) | 2025 | Project uses @base-ui/react primitives. CLI auto-resolves correct variant |
| Manual dark mode toggle | next-themes `enableSystem` | Stable | No toggle needed per user decision. System preference only |

**Deprecated/outdated:**
- `framer-motion` import path: Use `motion/react` instead
- Zod v3 `z.string().min(1, { message: "..." })`: In Zod 4, use `.error("...")` for simple messages
- shadcn/ui Form component (old Radix style): base-nova uses Controller + Field pattern directly

## Open Questions

1. **shadcn Sidebar availability for base-nova**
   - What we know: Official docs show Sidebar component at `ui.shadcn.com/docs/components/base/sidebar`. CLI should pull correct variant.
   - What's unclear: Exact API differences between Radix and Base UI sidebar variants.
   - Recommendation: Run `npx shadcn@latest add sidebar` and inspect generated code. Adjust usage if API differs from Radix examples.

2. **Combobox component exact API for base-nova**
   - What we know: shadcn docs show Combobox with ComboboxInput/ComboboxContent/ComboboxList/ComboboxItem. Base UI may have slight API differences.
   - What's unclear: Whether the generated Combobox uses the same sub-component pattern.
   - Recommendation: Install and inspect. The Combobox is critical for EN 15459 selector (80+ items with search).

3. **Chart color palette for dark mode**
   - What we know: Recharts accepts fill/stroke colors. The existing chart CSS variables (`--chart-1` through `--chart-5`) use grayscale.
   - What's unclear: Best approach for distinct categorical colors that work in both light and dark modes.
   - Recommendation: Define custom chart color tokens in globals.css using oklch (like EURAC tokens). Test contrast in both modes. Use 4-5 distinct hues for LCC breakdown categories.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/app/layout.tsx`, `src/app/globals.css`, `src/server/trpc/client.tsx`, `src/server/trpc/router.ts`, `src/server/trpc/routers/*`, `prisma/schema.prisma`, `package.json`, `components.json`
- [Next.js App Router Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) - Route groups, nested layouts, template.tsx
- [tRPC v11 TanStack React Query Usage](https://trpc.io/docs/client/tanstack-react-query/usage) - useTRPC, queryOptions, mutationOptions
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Accordion, Combobox, Sidebar, Form, Tabs
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/base/sidebar) - Base UI variant of Sidebar component
- [React Hook Form useWatch](https://react-hook-form.com/docs/usewatch) - Change detection for autosave

### Secondary (MEDIUM confidence)
- [motion.dev React docs](https://motion.dev/docs/react-motion-component) - motion/react import path, AnimatePresence
- [Recharts BarChart API](https://recharts.github.io/en-US/api/BarChart/) - stackId for stacked bars
- [next-themes README](https://github.com/pacocoursey/next-themes) - enableSystem, attribute="class"
- [Zod v4 Migration Guide](https://zod.dev/v4/changelog) - .error() replaces .message(), .meta() for metadata
- [react-number-format docs](https://s-yadav.github.io/react-number-format/docs/numeric_format/) - NumericFormat, onValueChange

### Tertiary (LOW confidence)
- shadcn base-nova exact component APIs: Verified the style exists and CLI resolves it, but exact sub-component patterns may differ from Radix docs. Install and inspect.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed and verified in package.json. Versions confirmed.
- Architecture: HIGH - URL-driven wizard, route groups, autosave pattern well-documented and proven.
- Pitfalls: HIGH - All pitfalls verified against official docs (hydration, useWatch loops, AnimatePresence in App Router).
- Form patterns: MEDIUM - Zod 4 error API and base-nova Form component pattern need validation during implementation.

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable stack, no fast-moving dependencies)

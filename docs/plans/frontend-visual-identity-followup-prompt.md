# LCC Frontend — Visual Identity Follow-up Prompt

> Copy everything below the line and paste it into the same LLM session that is currently implementing `docs/plans/frontend-uiux-improvement-prompt.md`. This is an augmentation, not a replacement: the information architecture, progressive disclosure, help system, accessibility, mobile, i18n, and validation-summary work already scoped in that prompt still stands. This prompt adds a concrete **visual identity** to apply on top.

---

# ROLE

You are continuing the frontend UX work on the EURAC LCC calculator. The previous prompt gave you the information architecture, form patterns, help system, accessibility, mobile and i18n workstreams. You have already produced (or are producing) the page-by-page redesigns, the component inventory, the prioritized roadmap, and the copy guidelines.

Your job now is to **lock in a specific visual identity** — borrowed verbatim from a sibling EURAC research app the product owner has already shipped — and apply it consistently across the screens you are redesigning. Treat this as a brand decision: the product owner wants the LCC calculator to feel like a member of the same visual family.

Do NOT re-open IA / UX decisions because of this. The visual identity is a skin; your IA and flows stay as scoped. When the two conflict (e.g. a layout decision in the previous prompt vs. a composition rule here), flag it in §10 (open questions) of your existing deliverable rather than silently choosing.

---

# VISUAL IDENTITY SPECIFICATION (verbatim from the sibling app — TREAT AS LAW)

## Overall aesthetic
Modern academic/scientific web app — polished, data-dense but airy. A mix of **glassmorphism** (frosted translucent cards) and **soft neumorphic accents** over a light ambient gradient. Feels like a premium research instrument: trustworthy, precise, slightly editorial.

## Color palette

**Primary accent:** `#C8102E` (Eurac red). Used **sparingly** — CTAs, brand highlights, inline emphasis via `<span>`. Never as a section background.

**Neutral scale (Tailwind slate):**
- Backgrounds: `slate-50` / `white` / `slate-100`
- Body text: `slate-500` / `slate-600`
- Headings: `slate-900`
- Borders: `slate-100` / `slate-200`
- Dark panel: `slate-900`

**Domain color-coding.** Every thematic section has its own tint — always pastel `50/100` background + `400/500/600` saturated accent. In the sibling app the mapping was:
- Indoor Air Quality → cyan (`cyan-50 / cyan-500 / cyan-600`)
- Thermal Comfort → rose (`rose-50 / rose-500`)
- Visual/Daylighting → amber (`amber-50 / amber-500 / amber-600`)
- Productivity → emerald
- Health/shield → blue
- Building → slate

You must propose an **LCC-specific mapping** (see "Adaptation tasks" below). Keep the discipline: **one tint per domain, never swap**.

**Ambient background.**
```
bg-gradient-to-br from-slate-50 via-white to-slate-100
```
Plus three large blurred radial "glow blobs" (`h-72 w-72 rounded-full blur-3xl`) in `eurac-red/10`, `blue-500/10`, `emerald-400/10`, positioned at corners. These give depth without distraction.

## Typography

Font: **Inter** (sans-serif), exclusively.

- Hero heading: `text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]` with the second line emphasized in `eurac-red`.
- Section headings: `text-sm font-bold text-slate-900 tracking-tight`.
- Body text: `text-sm text-slate-500 leading-relaxed`; hero description copy often `text-base`.
- Micro-labels / eyebrow tags: `text-[10px] font-bold uppercase tracking-widest text-slate-400/500`, often inside a pill (`rounded-full bg-slate-100 px-3 py-1`).
- Numerical values: always `tabular-nums` on large totals.

## Layout & containers

- Root: `container mx-auto px-4 py-8 lg:py-12`. Content max-widths `max-w-3xl` / `max-w-4xl` for hero copy.
- Primary cards: `rounded-3xl bg-white/80 shadow-xl ring-1 ring-white/40` with a subtle SVG dot/plus pattern at `opacity-[0.03]` as background texture.
- GlassCard (reusable): `bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl`.
- Domain sub-sections: `rounded-xl border-l-4 border-{color}-500 bg-{color}-50/30 p-4 shadow-sm` — **a 4px colored left border is the signature device** that marks each domain block.
- Dark summary panel (grand total / headline KPI): `rounded-2xl bg-slate-900 p-5 text-white shadow-xl` with a circular red icon badge.
- Corner-radius scale: `rounded-lg` (inputs, small pills) → `rounded-xl` (cards, buttons) → `rounded-2xl` (panels) → `rounded-3xl` (hero / feature cards). **Always rounded, never sharp.**

## Buttons

- **Primary CTA:** `rounded-xl bg-eurac-red px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-eurac-red/20` + `hover:-translate-y-0.5 hover:shadow-xl hover:shadow-eurac-red/25`. Icon-left, arrow-right trailing icon.
- **Secondary:** `rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200` + `hover:-translate-y-0.5 hover:bg-slate-50`.
- **Reference / tertiary (e.g. "See EN 15459", "Open standard"):** colored gradient `bg-gradient-to-r from-{color}-50 to-{color}-100/80` with matching `ring-1 ring-{color}-200/60`; active state `active:scale-[0.97]`.

## Icons & visual devices

- Icon library: **lucide-react exclusively**. Usable set: `Wind, ThermometerSun, Lightbulb, BarChart3, TrendingUp, ShieldCheck, Building2, BookOpen, ArrowRight, Info, Mail, Calculator, Coins, Zap, Hammer, Leaf, Percent, Calendar…`.
- Icon badges: small colored square `h-10 w-10 rounded-xl flex items-center justify-center bg-{color}-100` containing a `h-5 w-5 text-{color}-600` icon. Sits top-left of feature cards.
- Progress bars: `h-1.5 rounded-full` with colored fill (decorative or data-bound).
- Version tag: `text-[10px] uppercase tracking-wider font-medium text-slate-400 bg-white/60 px-2.5 py-1 rounded-md ring-1 ring-slate-100`.

## Motion

- Library: **framer-motion** (this project ships it as the `motion` package — same API).
- Hover on cards: `transition-all duration-300 hover:-translate-y-1 hover:shadow-lg` (feature cards) or `-translate-y-0.5` (publications, buttons). Every interactive element lifts slightly.
- Custom CSS keyframes: `fadeIn 0.3s`, `slideUp 0.3s`, `scaleIn 0.2s` — short, ease-out, **never bouncy**.
- Bars / fills: `transition-all duration-700` for long progressive reveals.
- Reduced motion: respect `prefers-reduced-motion` and collapse all durations to `0.01ms`.

## Inputs

- Number inputs: `rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-sm shadow-inner focus:border-eurac-red focus:ring-1 focus:ring-eurac-red/20`. Icon + micro-label + optional `InfoTooltip` above the field; suffix unit (`EUR`, `m²`, `kWh/m²·yr`, `%`) in small grey text after the field.
- Sliders: paired with live numeric display, `h-8` for touch.
- Tooltips: dark `bg-slate-800 text-slate-100 text-[11px] rounded-lg shadow-lg`, arrow pointer, portaled to body, animated with motion.

## Data visualization

- Library: **Recharts** (already in the stack).
- Bars: `radius={[4, 4, 0, 0]}` (rounded top), `barSize={32}`, `fill` uses the domain accent hex.
- Grid: `strokeDasharray="3 3" stroke="#e2e8f0"`.
- Axis / tooltip typography: 11px, minimal.

## Composition principles

- **Hero / project landing** (three parts stacked): centered title block → 3-column domain cards (colored) → dual CTA row.
- **Dashboard layout:** `lg:grid-cols-12` split, sticky input panel on the left (`lg:col-span-4`), results on the right (`lg:col-span-8`).
- **Results are always grouped by domain** using the colored left-border container pattern, each with: title row + tertiary "References" button, a 3-metric KPI grid, a 2-column split of (bar chart | small-stat grid).
- Color-code is **semantic and consistent** — never swap.
- Whitespace is generous: `space-y-8` or `space-y-10` between major sections, `gap-4/5/6` inside grids.
- **Brand restraint:** `eurac-red` appears rarely — only on CTAs, brand emphasis word in headline, total-cost icon badge, focus rings.
- Depth via layering: translucent white over soft gradient over blurred color blobs. No heavy shadows — always `shadow-sm/lg/xl` with low opacity.

---

# ADAPTATION TASKS (LCC-specific work you must do)

## 1. Stack reconciliation
The sibling app ships React 18 + Vite + raw Tailwind with a custom `eurac-red` extension. This app ships:
- **Next.js 15** App Router (not Vite)
- **Tailwind v4** (CSS-first config, OKLCH tokens in `src/app/globals.css` — not `tailwind.config.js`)
- **shadcn/ui** wrappers over Radix (not raw HTML)
- **motion** (framer-motion fork — same API)
- **Recharts v3**

Do not swap any of these. Where the sibling app used a raw Tailwind class, use the shadcn equivalent if one exists (`<Card>`, `<Button variant="default">`, etc.) and add the visual classes via `className`. Where shadcn's default style conflicts with the identity, override with `className`, **do not fork the component**.

The current `eurac-red` lives in `src/app/globals.css` as an OKLCH token (`oklch(0.48 0.18 27.5)`). Keep OKLCH as the source of truth; add a hex alias only if a Tailwind utility like `bg-eurac-red` requires it in v4's @theme block. Verify the hex you add matches `#C8102E`.

## 2. Propose the LCC domain color mapping
The sibling app maps cyan=air, rose=thermal, amber=visual. The LCC calculator has a different semantic structure. Produce a mapping table covering at least these domains, explaining each choice:

| LCC domain | Where it appears | Tint proposal | Justification |
|---|---|---|---|
| Finance / boundary conditions (FIN) | `/wlc` top section | ? | ? |
| Construction costs (A1–E1) | `/construction` | ? | ? |
| Energy (NRG, heating / cooling / DHW / household) | `/energy` | ? | ? |
| PV production | `/energy` | ? | ? |
| Maintenance (MNT, EN 15459) | derived from `/construction` + results | ? | ? |
| Residual value (RES) | results | ? | ? |
| Income / NPV (INC) | `/info` income section + results | ? | ? |
| Headline totals (LCC, WLC) | results | dark slate panel + red badge | matches sibling's "grand total" pattern |

Pick from this palette (Tailwind defaults): slate, stone, zinc, amber, orange, yellow, rose, red, emerald, teal, cyan, sky, blue, indigo, violet, purple. Preserve `eurac-red` for brand accent only.

Once chosen, the mapping is frozen. Propagate it to: left-border domain cards, icon badges, reference buttons, chart bar fills, KPI chips.

## 3. Update `src/app/globals.css`
- Register `--color-eurac-red: oklch(0.48 0.18 27.5);` (already there — keep).
- Add the three ambient glow-blob CSS (absolute positioning + blur) as a reusable utility or Next.js layout-level element.
- Register the `fadeIn` / `slideUp` / `scaleIn` keyframes.
- Register the `.pattern-dots` utility (subtle SVG background at `opacity-[0.03]` for primary cards). Inline SVG as `background-image: url("data:image/svg+xml;...")`.

## 4. Upgrade the existing primitives
- **`GlassCard`** (`src/components/shared/glass-card.tsx`): swap the current `bg-card/95 backdrop-blur-sm` to the spec form `bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl`. Keep the dark-mode branch (dark variant uses `bg-slate-900/80 border-white/10`).
- **`DomainSection`** (new): the 4px-left-border container. Props: `domain: 'fin' | 'nrg' | 'mnt' | ...`, `title`, `icon`, `reference?`. Renders `rounded-xl border-l-4 border-{domain}-500 bg-{domain}-50/30 p-4 shadow-sm`. Use this wrapper wherever a page introduces a domain block.
- **`IconBadge`** (new): `h-10 w-10 rounded-xl flex items-center justify-center bg-{color}-100` with `h-5 w-5 text-{color}-600` lucide icon.
- **`AmbientBackground`** (new): renders the gradient + 3 blurred blobs, absolute-positioned behind everything. Mounts once in `src/app/(app)/layout.tsx`.
- **`InfoTooltip`**: keep Radix, restyle popover content to `bg-slate-800 text-slate-100 text-[11px] rounded-lg shadow-lg` per spec.
- **`PercentInput`**, **`CurrencyInput`**: restyle input shell to the spec's rounded-lg + shadow-inner + focus-eurac-red pattern. Keep react-number-format.
- **Buttons**: keep shadcn `<Button>` but add two identity-specific variants: `variant="brand"` (CTA) and `variant="reference"` (colored gradient tertiary).

## 5. Compose the redesigned pages using the identity
Apply the composition principles from §"Composition principles" above to each route you redesigned in the prior prompt:
- `/projects` — hero landing style.
- `/projects/[id]/info` — grouped domain sections (building metadata, geometry, income), each wrapped in `DomainSection`.
- `/projects/[id]/wlc` — two domain sections (boundary conditions, non-construction + design costs).
- `/projects/[id]/construction` — domain-per-group accordion BUT each accordion header uses the left-border device + IconBadge.
- `/projects/[id]/energy` — two domain blocks (consumption, PV).
- `/projects/[id]/results` — the **dashboard layout** spec. Sticky input-summary panel left (`lg:col-span-4`), results right (`lg:col-span-8`). Results grouped by domain. LCC and WLC totals rendered in the dark slate panel with red circular icon badge.

## 6. Update data-viz
- All Recharts `<Bar>` get `radius={[4,4,0,0]}` and `barSize={32}`.
- Grid `strokeDasharray="3 3" stroke="#e2e8f0"`.
- Tooltip and axis labels at 11px.
- Replace the current 5-color OKLCH chart palette with the domain mapping you defined in Adaptation Task §2. Chart colors must **semantically match** the domain being plotted (energy bars = the NRG tint, maintenance = the MNT tint, etc.). Never use arbitrary chart-1..chart-5.

## 7. Hero / headline
Every route's top of page has the same composition: eyebrow pill (uppercase micro-label) → H1 (`text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]` with second line in `text-eurac-red`) → one-line description (`text-base text-slate-500`). Keep it short — this is navigation context, not marketing copy.

## 8. Motion conventions
Codify three reusable motion presets in a new `src/lib/motion-presets.ts`:
- `fadeInUp` — `{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: 'easeOut' } }`.
- `stagger` — container preset with `staggerChildren: 0.08`.
- `softLift` — hover preset for cards: `{ whileHover: { y: -4 }, transition: { duration: 0.3 } }`.

Wire the existing KPI-card stagger and variant-column stagger to these presets. Every bar fill / progress reveal uses `duration-700`. Respect `prefers-reduced-motion` everywhere.

---

# REQUIRED ADDITIONAL DELIVERABLES

Add these to the Markdown document you are already producing for the prior prompt. Do NOT ship a separate file — keep one consolidated deliverable.

## §8b Visual identity mapping (domain color table)
The filled table from Adaptation Task §2. Justify each choice in one sentence.

## §8c Updated design tokens
Full new `globals.css` `@theme` block: colors (including the domain tints as CSS vars if useful), the three keyframes, the pattern-dots utility, and the `.ambient-blob` classes.

## §8d Primitive upgrade diffs
For each primitive listed in Adaptation Task §4, a short JSX snippet showing the updated props and classes. Use the actual shadcn / Radix / motion APIs — do not invent prop shapes.

## §8e Per-route composition sketches
One ASCII / JSX sketch per route showing the hero → domain sections → totals / results layout applied. Keep each under 40 lines.

## §8f Recharts theme object
A small exported `chartTheme` from `src/lib/chart-theme.ts` with `strokeDasharray`, `stroke`, `barSize`, `barRadius`, `tooltipStyle`, `axisTick`, and a `domainColor(domain)` helper returning the hex for a given LCC domain.

---

# RULES OF ENGAGEMENT (additive to the prior prompt)

1. **Never swap a domain color.** Once your mapping is defined, `energy` is always the same tint, in every page, every chart, every icon badge.
2. **`eurac-red` is scarce.** Maximum four appearances per screen: primary CTA, brand emphasis word in H1, total-cost icon badge, focus ring. If it appears more often than that, you are over-using it.
3. **Rounded corners only.** Never `rounded-none` or sharp edges.
4. **Reject heavy shadows.** Always `shadow-sm`, `shadow-lg`, or `shadow-xl` with low opacity. No `shadow-2xl`.
5. **Glass only over gradient.** The glassmorphic cards rely on the ambient gradient + blobs behind them. If you place a glass card on a plain white section, it loses its character — either add the ambient backdrop to that section or use a solid `rounded-2xl bg-white shadow-xl` card instead.
6. **Preserve accessibility from the prior prompt.** The visual identity is a skin; contrast, keyboard navigation, ARIA labels, and focus rings are non-negotiable. If a pastel tint fails WCAG AA against slate-500 body text, pick a darker shade for text on that tint.
7. **Stack respect.** Do not introduce new UI libraries. If the identity calls for a pattern not native to shadcn, wrap/style shadcn — don't import Mantine / Chakra / raw Radix directly.
8. **Kill orphan tokens.** The current `chart-1..chart-5` OKLCH tokens in `globals.css` must be removed or repurposed once the domain-color mapping is in place. No orphan chart colors.
9. **Brief commit scope.** When this work ships, it must be commit-splittable: (a) design tokens + primitives, (b) per-route applications, (c) chart-theme migration. Structure your code so this is feasible.
10. **Document the identity.** Add a one-page `docs/visual-identity.md` summarizing the palette, domain mapping, typography scale, and composition rules so future contributors don't have to reverse-engineer the choices.

Start by producing §8b (the domain color mapping). The rest of the visual-identity work depends on those choices. Deliver §8b first, then continue with §8c..§8f in order.

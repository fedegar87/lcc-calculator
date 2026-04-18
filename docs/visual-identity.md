# LCCzero Visual Identity

## Purpose

LCCzero should look like a member of the same EURAC research-app family as the sibling academic tool: polished, data-dense, airy, and trustworthy. The visual system is a mix of glassmorphism, soft ambient gradients, and disciplined domain color-coding. It is not a marketing skin. It is a scientific UI language.

## Brand accent

- Primary brand accent: `eurac-red` = `#C8102E`
- Use it sparingly: primary CTA, brand-emphasis word in the route H1, focus ring, totals badge
- Do not use `eurac-red` as a large section background

## Domain mapping

| Domain | Surface tint | Accent |
| --- | --- | --- |
| Finance / boundary conditions | `blue-50` | `blue-500/600` |
| Construction costs | `amber-50` | `amber-500/600` |
| Energy consumption | `cyan-50` | `cyan-500/600` |
| PV production | `yellow-50` | `yellow-500/600` |
| Maintenance / EN 15459 | `teal-50` | `teal-500/600` |
| Residual value | `violet-50` | `violet-500/600` |
| Income / NPV | `emerald-50` | `emerald-500/600` |
| Headline totals | `slate-900` panel | `eurac-red` badge |

Rule: one domain, one tint, everywhere. Charts, icon badges, left borders, tertiary reference buttons, KPI chips, and helper panels must all use the same mapping.

## Typography

- Font: `Inter` only
- Route H1: `text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]`
- Accent word in H1: `text-eurac-red`
- Section headings: `text-sm font-bold tracking-tight text-slate-900`
- Body copy: `text-sm text-slate-500 leading-relaxed`
- Eyebrow pill: `text-[10px] font-bold uppercase tracking-widest text-slate-500`
- Totals and KPI values: always `tabular-nums`

## Containers

- Ambient page background: `bg-gradient-to-br from-slate-50 via-white to-slate-100`
- Add three blurred radial blobs in red, blue, and emerald at low opacity
- Primary glass surface: `rounded-2xl border border-white/20 bg-white/70 shadow-xl backdrop-blur-lg`
- Signature domain block: `rounded-xl border-l-4 bg-{domain}-50/30 p-4 shadow-sm`
- Headline totals: `rounded-2xl bg-slate-900 text-white shadow-xl`

## Buttons

- `brand`: rounded, red, lifted, shadowed CTA
- `outline`: white or neutral supporting action
- `reference`: domain-tinted gradient button for standards/help links

## Motion

- Short, ease-out, never bouncy
- Cards lift slightly on hover
- Dense form entry should stay calm; animate state change, not every keystroke
- Honor `prefers-reduced-motion`

## Composition rules

- Every route starts with: eyebrow pill -> H1 -> one-line description
- Use generous spacing between major sections: `space-y-8` or `space-y-10`
- Use glass cards only over the ambient gradient or another layered surface
- Use rounded corners everywhere; never sharp edges
- Keep shadows low-opacity: `shadow-sm`, `shadow-lg`, `shadow-xl`

## Chart rules

- Recharts only
- Bars: `radius={[4,4,0,0]}`, `barSize={32}`
- Grid: `strokeDasharray="3 3" stroke="#e2e8f0"`
- Axis and tooltip text: 11px
- Chart colors must come from the frozen domain mapping, never generic `chart-1..chart-5`

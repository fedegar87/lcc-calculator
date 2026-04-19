import { cn } from "@/lib/utils";

const STATS = [
  {
    value: "60%",
    label: "Investment",
    sub: "Design, materials, labour",
    tile: "bg-construction-50/60 ring-construction-100",
    accent: "text-construction-700",
    bar: "bg-construction-500",
    pct: "w-[60%]",
  },
  {
    value: "40%",
    label: "Operation",
    sub: "Energy + maintenance over 40y",
    tile: "bg-nrg-50/60 ring-nrg-100",
    accent: "text-nrg-700",
    bar: "bg-nrg-500",
    pct: "w-[40%]",
  },
  {
    value: "≈15%",
    label: "Energy alone",
    sub: "Of total LCC, after on-site RES",
    tile: "bg-pv-50/60 ring-pv-100",
    accent: "text-pv-700",
    bar: "bg-pv-500",
    pct: "w-[15%]",
  },
];

export function FindingsStats() {
  return (
    <section id="findings" className="space-y-4">
      <header className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Findings · 13 frontrunner buildings (D2.2)
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Where the money actually goes in nZEBs
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Across the CRAVEzero case studies, the LCC structure is consistent
          enough to plan against — and surprising enough to disprove the
          &ldquo;nZEBs are just expensive&rdquo; objection.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {STATS.map((s) => (
          <article
            key={s.label}
            className={cn("rounded-2xl p-5 ring-1", s.tile)}
          >
            <p className={cn("text-3xl font-bold tabular-nums", s.accent)}>
              {s.value}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">
              {s.label}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {s.sub}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
              <div className={cn("h-full rounded-full", s.bar, s.pct)} />
            </div>
          </article>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Plus-energy buildings (e.g.{" "}
        <span className="font-semibold">Green Home Nanterre</span>) flip the
        sign: exported energy &gt; consumed, so the energy line becomes a
        net credit over the life cycle.
      </p>
    </section>
  );
}

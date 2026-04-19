import { GlassCard } from "@/components/shared/glass-card";

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Define energy and cost goals",
    body: "Set consumption and life-cycle cost targets up-front as the foundation of the project.",
  },
  {
    title: "Track actions across the life cycle",
    body: "Shared interdisciplinary understanding, transparent processes and KPIs tracked end-to-end.",
  },
  {
    title: "Create win-win for stakeholders",
    body: "Business models so planners, developers, contractors, users and the environment all benefit.",
  },
  {
    title: "Select optimal technical solution sets",
    body: "Cost-efficient technology bundles and renewables, based on industrialised, multifunctional components.",
  },
  {
    title: "Conduct life-cycle cost analysis",
    body: "LCC across design, construction, operation, maintenance and end-of-life — balance capex vs. opex.",
  },
  {
    title: "Quantify co-benefits",
    body: "Health, productivity, rental value, reduced employee turnover.",
  },
  {
    title: "Learn from frontrunners",
    body: "Study nZEB projects already realised cost-efficiently; avoid known pitfalls.",
  },
  {
    title: "Integrate into business cases",
    body: "Weave technologies and business models into a single planning, construction and operation framework.",
  },
];

export function MethodologySteps() {
  return (
    <GlassCard id="methodology-steps" className="space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          The CRAVEzero way
        </p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          An 8-step framework from design to operation
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          The methodology that frames every project in LCCzero.
        </p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex gap-3 rounded-xl border border-slate-100 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eurac-red/10 text-[11px] font-bold tabular-nums text-eurac-red ring-1 ring-eurac-red/20">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

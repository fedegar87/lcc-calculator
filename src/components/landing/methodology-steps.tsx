import Image from "next/image";
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
    <GlassCard id="methodology" className="space-y-5">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
            The CRAVEzero way
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            An 8-step framework from design to operation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The methodology that frames every project in LCCzero.
          </p>
        </div>
        <div className="hidden shrink-0 sm:block sm:w-1/3 max-w-[200px]">
           <Image 
             src="/visuals/methodology_3d.png" 
             width={300} 
             height={300} 
             alt="3D Isometric representation of methodology" 
             className="w-full h-auto drop-shadow-xl" 
           />
        </div>
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

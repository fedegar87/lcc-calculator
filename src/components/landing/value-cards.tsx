import { GlassCard } from "@/components/shared/glass-card";
import { Calculator, ScanSearch, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

type ValueCard = {
  icon: typeof Calculator;
  iconTile: string;
  title: string;
  body: string;
};

const VALUES: ValueCard[] = [
  {
    icon: Calculator,
    iconTile: "bg-eurac-red/10 text-eurac-red",
    title: "Standard-compliant LCC",
    body: "Deterministic life-cycle cost over the selected reference period, with construction, energy, maintenance and residual value layered on a CEEC element breakdown.",
  },
  {
    icon: ScanSearch,
    iconTile: "bg-fin-100 text-fin-600",
    title: "Sensitivity built in",
    body: "Differential sensitivity at ±10% per Pernetti et al. (2021) — one click on any variant ranks which inputs drive your LCC. Elementary Effects screening lands next.",
  },
  {
    icon: FileSpreadsheet,
    iconTile: "bg-construction-100 text-construction-600",
    title: "Built on real cases",
    body: "Grounded in CRAVEzero and the 11 nZEB case-study evidence discussed by Pernetti et al. (2021).",
  },
];

export function ValueCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {VALUES.map((v) => {
        const Icon = v.icon;
        return (
          <GlassCard key={v.title} className="space-y-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                v.iconTile,
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {v.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {v.body}
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}

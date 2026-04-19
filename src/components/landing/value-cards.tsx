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
    body: "Net present value over 40 years per ISO 15686-5, with construction, energy, maintenance and residual value layered on a CEEC element breakdown.",
  },
  {
    icon: ScanSearch,
    iconTile: "bg-fin-100 text-fin-600",
    title: "Sensitivity by design",
    body: "Differential and Elementary-Effects sensitivity baked into the workflow. The four parameters that drive 26% of LCC variance are surfaced first.",
  },
  {
    icon: FileSpreadsheet,
    iconTile: "bg-construction-100 text-construction-600",
    title: "Built on real cases",
    body: "Methodology validated on 11 nZEB case studies (Pernetti et al., 2021) across France, Italy, Sweden, Austria and Germany.",
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

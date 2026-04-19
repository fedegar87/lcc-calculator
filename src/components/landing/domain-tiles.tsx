import {
  Building2,
  Zap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LCCDomain } from "@/components/shared/icon-badge";

/**
 * Three "domain tiles" — the visual hook of the landing.
 * Each tile signals one of the cost axes covered by LCCzero, using the
 * frozen domain palette (construction / nrg / fin).
 */
type Tile = {
  domain: LCCDomain;
  label: string;
  metric: string;
  detail: string;
  icon: LucideIcon;
  /** Tailwind w-* utility used as a fake "coverage" bar fill. */
  barWidth: string;
};

const TILES: Tile[] = [
  {
    domain: "construction",
    label: "Investment",
    metric: "Construction & structural",
    detail: "CEEC element breakdown · structural elements drive 12% of LCC",
    icon: Building2,
    barWidth: "w-[78%]",
  },
  {
    domain: "nrg",
    label: "Operation",
    metric: "Energy & maintenance over 40y",
    detail: "PHPP final energy · EN 15459 maintenance factors",
    icon: Zap,
    barWidth: "w-[88%]",
  },
  {
    domain: "fin",
    label: "Sensitivity",
    metric: "DSA + Elementary Effects",
    detail: "Morris/Campolongo · interest rate dominates LCC variance",
    icon: TrendingUp,
    barWidth: "w-[92%]",
  },
];

const TILE_SURFACE: Record<LCCDomain, string> = {
  fin: "bg-fin-50/60 ring-fin-100",
  construction: "bg-construction-50/60 ring-construction-100",
  nrg: "bg-nrg-50/60 ring-nrg-100",
  pv: "bg-pv-50/60 ring-pv-100",
  mnt: "bg-mnt-50/60 ring-mnt-100",
  res: "bg-res-50/60 ring-res-100",
  inc: "bg-inc-50/60 ring-inc-100",
};

const TILE_ICON_TILE: Record<LCCDomain, string> = {
  fin: "bg-fin-100 text-fin-600",
  construction: "bg-construction-100 text-construction-600",
  nrg: "bg-nrg-100 text-nrg-600",
  pv: "bg-pv-100 text-pv-700",
  mnt: "bg-mnt-100 text-mnt-600",
  res: "bg-res-100 text-res-600",
  inc: "bg-inc-100 text-inc-600",
};

const TILE_BAR: Record<LCCDomain, string> = {
  fin: "bg-fin-500",
  construction: "bg-construction-500",
  nrg: "bg-nrg-500",
  pv: "bg-pv-500",
  mnt: "bg-mnt-500",
  res: "bg-res-500",
  inc: "bg-inc-500",
};

export function DomainTiles() {
  return (
    <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
      {TILES.map((t) => {
        const Icon = t.icon;
        return (
          <article
            key={t.domain}
            className={cn(
              "group rounded-2xl p-5 ring-1 transition hover:-translate-y-1 hover:shadow-lg",
              TILE_SURFACE[t.domain],
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  TILE_ICON_TILE[t.domain],
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t.label}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {t.metric}
                </p>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
              <div
                className={cn("h-full rounded-full", TILE_BAR[t.domain], t.barWidth)}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t.detail}
            </p>
          </article>
        );
      })}
    </div>
  );
}

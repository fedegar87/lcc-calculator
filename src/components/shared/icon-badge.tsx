import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LCCDomain =
  | "fin"
  | "construction"
  | "nrg"
  | "pv"
  | "mnt"
  | "res"
  | "inc";

const DOMAIN_BADGE_CLASSES: Record<LCCDomain, string> = {
  fin: "bg-fin-50 text-fin-600 border border-fin-200/80 shadow-xs dark:bg-fin-950/80 dark:text-fin-400 dark:border-fin-500/30",
  construction:
    "bg-construction-50 text-construction-700 border border-construction-200/80 shadow-xs dark:bg-construction-950/80 dark:text-construction-400 dark:border-construction-500/30",
  nrg: "bg-nrg-50 text-nrg-700 border border-nrg-200/80 shadow-xs dark:bg-nrg-950/80 dark:text-nrg-400 dark:border-nrg-500/30",
  pv: "bg-pv-50 text-pv-700 border border-pv-200/80 shadow-xs dark:bg-pv-950/80 dark:text-pv-400 dark:border-pv-500/30",
  mnt: "bg-mnt-50 text-mnt-700 border border-mnt-200/80 shadow-xs dark:bg-mnt-950/80 dark:text-mnt-400 dark:border-mnt-500/30",
  res: "bg-res-50 text-res-700 border border-res-200/80 shadow-xs dark:bg-res-950/80 dark:text-res-400 dark:border-res-500/30",
  inc: "bg-inc-50 text-inc-700 border border-inc-200/80 shadow-xs dark:bg-inc-950/80 dark:text-inc-400 dark:border-inc-500/30",
};

export function IconBadge({
  domain,
  icon: Icon,
  className,
}: {
  domain: LCCDomain;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        DOMAIN_BADGE_CLASSES[domain],
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

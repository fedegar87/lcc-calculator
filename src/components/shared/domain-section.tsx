import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBadge, type LCCDomain } from "@/components/shared/icon-badge";

const DOMAIN_SURFACE_CLASSES: Record<LCCDomain, string> = {
  fin: "border-l-fin-500 bg-fin-50/40 border-slate-200/70 dark:bg-fin-950/25 dark:border-white/[0.08] dark:border-l-fin-500",
  construction:
    "border-l-construction-500 bg-construction-50/40 border-slate-200/70 dark:bg-construction-950/25 dark:border-white/[0.08] dark:border-l-construction-500",
  nrg: "border-l-nrg-500 bg-nrg-50/40 border-slate-200/70 dark:bg-nrg-950/25 dark:border-white/[0.08] dark:border-l-nrg-500",
  pv: "border-l-pv-500 bg-pv-50/40 border-slate-200/70 dark:bg-pv-950/25 dark:border-white/[0.08] dark:border-l-pv-500",
  mnt: "border-l-mnt-500 bg-mnt-50/40 border-slate-200/70 dark:bg-mnt-950/25 dark:border-white/[0.08] dark:border-l-mnt-500",
  res: "border-l-res-500 bg-res-50/40 border-slate-200/70 dark:bg-res-950/25 dark:border-white/[0.08] dark:border-l-res-500",
  inc: "border-l-inc-500 bg-inc-50/40 border-slate-200/70 dark:bg-inc-950/25 dark:border-white/[0.08] dark:border-l-inc-500",
};

export function DomainSection({
  domain,
  title,
  description,
  icon,
  reference,
  children,
  className,
}: {
  domain: LCCDomain;
  title: string;
  description?: string;
  icon: LucideIcon;
  reference?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-l-4 p-5 shadow-xs backdrop-blur-xs transition-all",
        DOMAIN_SURFACE_CLASSES[domain],
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconBadge domain={domain} icon={icon} />
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            {description ? (
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {reference ? <div className="shrink-0">{reference}</div> : null}
      </header>
      {children}
    </section>
  );
}

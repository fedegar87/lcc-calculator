import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBadge, type LCCDomain } from "@/components/shared/icon-badge";

const DOMAIN_SURFACE_CLASSES: Record<LCCDomain, string> = {
  fin: "border-fin-500 bg-fin-50/30",
  construction: "border-construction-500 bg-construction-50/30",
  nrg: "border-nrg-500 bg-nrg-50/30",
  pv: "border-pv-500 bg-pv-50/30",
  mnt: "border-mnt-500 bg-mnt-50/30",
  res: "border-res-500 bg-res-50/30",
  inc: "border-inc-500 bg-inc-50/30",
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
        "rounded-xl border-l-4 p-4 shadow-sm",
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
              <p className="text-xs leading-relaxed text-slate-500">
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

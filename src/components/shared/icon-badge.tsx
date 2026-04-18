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
  fin: "bg-fin-100 text-fin-600",
  construction: "bg-construction-100 text-construction-600",
  nrg: "bg-nrg-100 text-nrg-600",
  pv: "bg-pv-100 text-pv-600",
  mnt: "bg-mnt-100 text-mnt-600",
  res: "bg-res-100 text-res-600",
  inc: "bg-inc-100 text-inc-600",
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

"use client";

import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantReadinessStatus } from "@/lib/project-readiness";

const STATUS_STYLES: Record<
  VariantReadinessStatus,
  { className: string; label: string; icon: typeof Circle }
> = {
  empty: {
    label: "Empty",
    className: "border-border text-muted-foreground",
    icon: Circle,
  },
  draft: {
    label: "Draft",
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100",
    icon: AlertTriangle,
  },
  preview_ready: {
    label: "Preview-ready",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100",
    icon: CheckCircle2,
  },
  analysis_ready: {
    label: "Analysis-ready",
    className:
      "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-950/20 dark:text-sky-100",
    icon: CheckCircle2,
  },
  publish_ready: {
    label: "Publish-ready",
    className: "border-primary/30 bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
};

export function ReadinessPill({
  status,
  className,
}: {
  status: VariantReadinessStatus;
  className?: string;
}) {
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2.5 py-0.5 font-medium",
        config.className,
        className,
      )}
      aria-label={`Variant status: ${config.label}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

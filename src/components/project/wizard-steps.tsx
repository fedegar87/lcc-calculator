"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  Check,
  Layers3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectReadiness, ProjectStepId } from "@/lib/project-readiness";

const WORKBOOK_TABS = [
  {
    id: "info" as const,
    stepNumber: 1,
    label: "Project & Geometry",
    subtitle: "General info & areas",
    icon: Building2,
  },
  {
    id: "energy" as const,
    stepNumber: 2,
    label: "Energy & Economy",
    subtitle: "Rates, tariffs & demand",
    icon: Zap,
  },
  {
    id: "construction" as const,
    stepNumber: 3,
    label: "Costs & Maintenance",
    subtitle: "Construction (A–E), O&M & WLC",
    icon: Layers3,
  },
  {
    id: "results" as const,
    stepNumber: 4,
    label: "Results & Charts",
    subtitle: "LCC/WLC summary & graphs",
    icon: BarChart3,
  },
] as const;

interface WizardStepsProps {
  projectId: string;
  currentStep: ProjectStepId;
  activeVariantId?: string;
  readiness?: ProjectReadiness | null;
}

function isTabPopulated(
  readiness: ProjectReadiness | null | undefined,
  tabId: "info" | "energy" | "construction" | "results",
): boolean {
  if (!readiness) return false;
  if (tabId === "results") {
    return readiness.previewReady;
  }
  if (tabId === "energy") {
    const energySec = readiness.sections.find((s) => s.id === "energy");
    const wlcSec = readiness.sections.find((s) => s.id === "wlc");
    return Boolean(
      (energySec?.requiredFilled ?? 0) > 0 && (wlcSec?.requiredFilled ?? 0) >= 2,
    );
  }
  const sec = readiness.sections.find((s) => s.id === tabId);
  return Boolean(sec && sec.requiredFilled >= sec.requiredTotal && sec.requiredTotal > 0);
}

export function WizardSteps({
  projectId,
  currentStep,
  activeVariantId,
  readiness,
}: WizardStepsProps) {
  const normalizedStep =
    currentStep === "wlc"
      ? "construction"
      : currentStep === "overview"
        ? "info"
        : currentStep;

  return (
    <nav
      aria-label="Workbook sheets"
      className="w-full border-b border-border/80 bg-muted/25 px-1 pt-1 rounded-t-xl"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {WORKBOOK_TABS.map((tab) => {
          const isCurrent = tab.id === normalizedStep;
          const isComplete = isTabPopulated(readiness, tab.id);
          const TabIcon = tab.icon;
          const href = activeVariantId
            ? `/projects/${projectId}/${tab.id}?v=${encodeURIComponent(activeVariantId)}`
            : `/projects/${projectId}/${tab.id}`;

          return (
            <Link
              key={tab.id}
              href={href}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-t-lg border border-b-0 px-3.5 py-2.5 transition-all",
                isCurrent
                  ? "border-border/90 bg-card text-foreground shadow-2xs"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground",
              )}
            >
              {isCurrent && (
                <span className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg bg-primary" />
              )}
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                )}
              >
                {isComplete && !isCurrent ? (
                  <Check className="size-3.5" />
                ) : (
                  <TabIcon className="size-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate text-xs font-semibold sm:text-sm",
                      isCurrent ? "text-foreground" : "text-foreground/80",
                    )}
                  >
                    {tab.stepNumber}. {tab.label}
                  </span>
                </div>
                <p className="hidden truncate text-[11px] text-muted-foreground lg:block">
                  {tab.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

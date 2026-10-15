"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardList,
  Home,
  Layers3,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProjectReadiness,
  ProjectReadinessSection,
  ProjectStepId,
} from "@/lib/project-readiness";

const STEPS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "info", label: "Info", icon: ClipboardList },
  { id: "wlc", label: "WLC", icon: SlidersHorizontal },
  { id: "construction", label: "Construction", icon: Layers3 },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "results", label: "Results", icon: BarChart3 },
] as const;

interface WizardStepsProps {
  projectId: string;
  currentStep: ProjectStepId;
  readiness?: ProjectReadiness | null;
}

function getSection(
  readiness: ProjectReadiness | null | undefined,
  stepId: string,
): ProjectReadinessSection | null {
  if (!readiness || stepId === "overview") return null;
  return readiness.sections.find((section) => section.id === stepId) ?? null;
}

function getStepHref(projectId: string, stepId: ProjectStepId) {
  if (stepId === "overview") {
    return `/projects/${projectId}`;
  }

  return `/projects/${projectId}/${stepId}`;
}

export function WizardSteps({
  projectId,
  currentStep,
  readiness,
}: WizardStepsProps) {
  const stepRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const overviewStatus = readiness
    ? `${readiness.statusLabel}, ${readiness.blockers.length} blockers, ${readiness.warnings.length} warnings`
    : "Project overview";
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  const currentLabel = STEPS[currentIndex]?.label ?? "Overview";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      stepRefs.current[currentStep]?.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [currentStep]);

  return (
    <div className="min-w-0 space-y-2 md:space-y-0">
      <nav
        className="relative max-w-full after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent xl:after:hidden"
        aria-label="Project sections"
      >
        <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
          {STEPS.map((step, i) => {
            const isCurrent = step.id === currentStep;
            const section = getSection(readiness, step.id);
            const hasBlockers =
              step.id === "overview"
                ? Boolean(readiness?.blockers.length)
                : Boolean(section?.blockers);
            const hasWarnings =
              step.id === "overview"
                ? Boolean(readiness?.warnings.length)
                : Boolean(section?.warnings);
            const isReady =
              step.id === "overview"
                ? Boolean(readiness?.previewReady)
                : Boolean(section?.isPreviewReady);
            const readinessLabel = hasBlockers
              ? "has blockers"
              : hasWarnings
                ? "has warnings"
                : isReady
                  ? "ready"
                  : "pending";
            const statusText =
              step.id === "overview"
                ? overviewStatus
                : section
                  ? `${section.requiredFilled} of ${section.requiredTotal} required, ${section.recommendedFilled} of ${section.recommendedTotal} recommended, ${section.blockers} blockers, ${section.warnings} warnings`
                  : "No progress data";
            const StepIcon = step.icon;
            const StatusIcon = hasBlockers
              ? AlertCircle
              : hasWarnings
                ? AlertTriangle
                : isReady
                  ? CheckCircle2
                  : Circle;

            const progressPct =
              section && section.requiredTotal > 0
                ? Math.min(100, Math.round((section.requiredFilled / section.requiredTotal) * 100))
                : isReady
                  ? 100
                  : 0;

            return (
              <div key={step.id} className="flex items-center gap-2">
                <Link
                  ref={(node) => {
                    stepRefs.current[step.id] = node;
                  }}
                  href={getStepHref(projectId, step.id)}
                  className={cn(
                    "group flex min-w-12 flex-col gap-1 rounded-xl border px-2.5 py-2 transition-all md:min-w-[7.5rem] md:px-3",
                    isCurrent
                      ? "border-primary/60 bg-primary/[0.05] shadow-xs ring-1 ring-primary/20 dark:bg-primary/[0.09]"
                      : "border-border/80 bg-card/80 hover:border-slate-300 hover:bg-muted/50 dark:border-white/[0.08] dark:hover:border-white/20",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.label}, ${readinessLabel}. ${statusText}`}
                >
                  <div className="flex items-center justify-center gap-1.5 md:justify-between md:gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
                        isCurrent
                          ? "font-semibold text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      <span className="md:hidden">{i + 1}</span>
                      <StepIcon className="size-3.5" />
                      <span className="hidden md:inline">{step.label}</span>
                    </span>
                    <StatusIcon
                      className={cn(
                        "size-3.5 shrink-0 transition-transform group-hover:scale-110",
                        hasBlockers && "text-destructive",
                        !hasBlockers && hasWarnings && "text-amber-500",
                        !hasBlockers && !hasWarnings && isReady && "text-emerald-500",
                        !hasBlockers &&
                          !hasWarnings &&
                          !isReady &&
                          "text-muted-foreground/40",
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="hidden text-[11px] text-muted-foreground md:block">
                    {step.id === "overview" ? (
                      readiness ? readiness.statusLabel : "Overview"
                    ) : section ? (
                      <span className="tabular-nums">
                        {section.requiredFilled}/{section.requiredTotal} req.
                      </span>
                    ) : (
                      "Pending"
                    )}
                  </div>
                  {/* Micro progress gauge */}
                  {step.id !== "overview" && (
                    <div className="hidden h-1 w-full overflow-hidden rounded-full bg-muted/60 md:block">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          hasBlockers
                            ? "bg-destructive"
                            : hasWarnings
                              ? "bg-amber-500"
                              : isReady
                                ? "bg-emerald-500"
                                : "bg-primary/70",
                        )}
                        style={{ width: `${Math.max(progressPct > 0 ? 8 : 0, progressPct)}%` }}
                      />
                    </div>
                  )}
                </Link>
                {i < STEPS.length - 1 && (
                  <div className="hidden h-px w-2 bg-border xl:block" />
                )}
              </div>
            );
          })}
        </div>
      </nav>
      <div className="sticky top-0 z-10 rounded-lg border bg-background/95 px-3 py-2 text-xs font-medium shadow-sm md:hidden">
        Step {currentIndex >= 0 ? currentIndex + 1 : 1} of {STEPS.length} —{" "}
        {currentLabel}
      </div>
    </div>
  );
}

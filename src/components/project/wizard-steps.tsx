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
  Settings2,
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
  { id: "wlc", label: "WLC", icon: Settings2 },
  { id: "construction", label: "Construction", icon: Layers3 },
  { id: "energy", label: "Energy", icon: Settings2 },
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

            return (
              <div key={step.id} className="flex items-center gap-2">
                <Link
                  ref={(node) => {
                    stepRefs.current[step.id] = node;
                  }}
                  href={getStepHref(projectId, step.id)}
                  className={cn(
                    "group flex min-w-12 flex-col gap-1 rounded-xl border px-2 py-2 transition-colors md:min-w-[7rem] md:px-3",
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card/70 hover:bg-muted/40",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.label}, ${readinessLabel}. ${statusText}`}
                >
                  <div className="flex items-center justify-center gap-1.5 md:justify-between md:gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
                        isCurrent
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      <span className="md:hidden">{i + 1}</span>
                      <StepIcon className="size-4 md:hidden" />
                      <span className="hidden md:inline">{step.label}</span>
                    </span>
                    <StatusIcon
                      className={cn(
                        "size-3.5 shrink-0",
                        hasBlockers && "text-destructive",
                        !hasBlockers && hasWarnings && "text-amber-500",
                        !hasBlockers && !hasWarnings && isReady && "text-emerald-500",
                        !hasBlockers &&
                          !hasWarnings &&
                          !isReady &&
                          "text-muted-foreground/50",
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="hidden text-[11px] text-muted-foreground md:block">
                    {step.id === "overview" ? (
                      readiness ? readiness.statusLabel : "Overview"
                    ) : section ? (
                      <>
                        {section.requiredFilled}/{section.requiredTotal} required
                      </>
                    ) : (
                      "Pending"
                    )}
                  </div>
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

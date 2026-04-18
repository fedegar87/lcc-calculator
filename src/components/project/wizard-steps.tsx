"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  ProjectReadiness,
  ProjectReadinessSection,
  ProjectStepId,
} from "@/lib/project-readiness";

const STEPS = [
  { id: "overview", label: "Overview" },
  { id: "info", label: "Info" },
  { id: "wlc", label: "WLC" },
  { id: "construction", label: "Construction" },
  { id: "energy", label: "Energy" },
  { id: "results", label: "Results" },
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
  const overviewStatus = readiness
    ? `${readiness.statusLabel}, ${readiness.blockers.length} blockers, ${readiness.warnings.length} warnings`
    : "Project overview";

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Project sections">
      {STEPS.map((step, i) => {
        const isCurrent = step.id === currentStep;
        const section = getSection(readiness, step.id);
        const hasBlockers = Boolean(section?.blockers);
        const hasWarnings = Boolean(section?.warnings);
        const isReady = Boolean(section?.isPreviewReady);
        const statusText =
          step.id === "overview"
            ? overviewStatus
            : section
              ? `${section.requiredFilled} of ${section.requiredTotal} required, ${section.recommendedFilled} of ${section.recommendedTotal} recommended, ${section.blockers} blockers, ${section.warnings} warnings`
              : "No progress data";

        return (
          <div key={step.id} className="flex items-center gap-2">
            <Link
              href={getStepHref(projectId, step.id)}
              className={cn(
                "group flex min-w-[7rem] flex-col gap-1 rounded-xl border px-3 py-2 transition-colors",
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card/70 hover:bg-muted/40",
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${step.label}. ${statusText}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    hasBlockers && "bg-destructive",
                    !hasBlockers && hasWarnings && "bg-amber-400",
                    !hasBlockers && !hasWarnings && isReady && "bg-emerald-500",
                    !hasBlockers &&
                      !hasWarnings &&
                      !isReady &&
                      "bg-muted-foreground/40",
                  )}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
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
    </nav>
  );
}

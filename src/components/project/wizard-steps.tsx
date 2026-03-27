"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "info", label: "Info" },
  { id: "wlc", label: "WLC" },
  { id: "construction", label: "Construction" },
  { id: "energy", label: "Energy" },
  { id: "results", label: "Results" },
] as const;

function getStorageKey(projectId: string) {
  return `lcc-visited-${projectId}`;
}

function getVisited(projectId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markVisited(projectId: string, stepId: string) {
  if (typeof window === "undefined") return;
  try {
    const visited = getVisited(projectId);
    visited.add(stepId);
    localStorage.setItem(
      getStorageKey(projectId),
      JSON.stringify([...visited])
    );
  } catch {
    // localStorage unavailable
  }
}

interface WizardStepsProps {
  projectId: string;
  currentStep: string;
}

export function WizardSteps({ projectId, currentStep }: WizardStepsProps) {
  useEffect(() => {
    markVisited(projectId, currentStep);
  }, [projectId, currentStep]);

  const visited = useMemo(() => getVisited(projectId), [projectId]);

  return (
    <nav className="flex items-center gap-2" aria-label="Wizard steps">
      {STEPS.map((step, i) => {
        const isCurrent = step.id === currentStep;
        const isVisited = visited.has(step.id);

        return (
          <div key={step.id} className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/${step.id}`}
              className="flex flex-col items-center gap-1 group"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-transparent",
                  !isCurrent && isVisited && "bg-primary",
                  !isCurrent && !isVisited && "bg-muted"
                )}
              />
              <span
                className={cn(
                  "text-xs transition-colors",
                  isCurrent
                    ? "font-medium text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {step.label}
              </span>
            </Link>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

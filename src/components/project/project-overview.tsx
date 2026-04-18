"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Layers3, Settings2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReadinessPill } from "@/components/project/readiness-pill";
import { ValidationSummaryCard } from "@/components/project/validation-summary-card";
import type { ProjectReadiness } from "@/lib/project-readiness";

const STEP_ICONS = {
  info: ClipboardList,
  wlc: Settings2,
  construction: Layers3,
  energy: Settings2,
  results: BarChart3,
} as const;

export function ProjectOverview({
  projectId,
  variantLabel,
  readiness,
  diffCount,
}: {
  projectId: string;
  variantLabel: string;
  readiness: ProjectReadiness;
  diffCount: number;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/95 backdrop-blur-sm">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Active variant</CardTitle>
            <CardDescription>
              Review readiness, blockers, and next actions before editing more
              inputs.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReadinessPill status={readiness.status} />
            <span className="text-sm text-muted-foreground">{variantLabel}</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Required completion
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {readiness.requiredFilled}/{readiness.requiredTotal}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Minimum fields needed for a meaningful preview.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Recommended completion
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {readiness.recommendedFilled}/{readiness.recommendedTotal}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Additional inputs that improve comparison and export quality.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Variant delta
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {diffCount}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Changed input groups relative to Base.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {readiness.sections.map((section) => {
          const Icon = STEP_ICONS[section.id];

          return (
            <Card key={section.id} className="border-border/70 bg-card/95">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex size-9 items-center justify-center rounded-lg border bg-muted/40">
                    <Icon className="size-4" />
                  </div>
                  {section.blockers > 0 ? (
                    <span className="text-xs font-medium text-destructive">
                      {section.blockers} blocker
                      {section.blockers === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {section.warnings} warning
                      {section.warnings === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm">{section.label}</CardTitle>
                  <CardDescription>
                    {section.requiredFilled}/{section.requiredTotal} required
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Required</span>
                    <span className="tabular-nums">
                      {section.requiredFilled}/{section.requiredTotal}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.max(
                          6,
                          (section.requiredFilled /
                            Math.max(section.requiredTotal, 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recommended</span>
                    <span className="tabular-nums">
                      {section.recommendedFilled}/{section.recommendedTotal}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link href={`/projects/${projectId}/${section.id}`} />}
                >
                  Open {section.label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ValidationSummaryCard projectId={projectId} readiness={readiness} />
    </div>
  );
}

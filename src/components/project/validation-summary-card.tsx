"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleAlert, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectReadiness } from "@/lib/project-readiness";

const ISSUE_STYLES = {
  blocker: {
    icon: CircleAlert,
    className:
      "border-destructive/40 bg-destructive/5 text-destructive dark:bg-destructive/10",
    badge: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-300 bg-amber-50/80 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100",
    badge: "outline" as const,
  },
  info: {
    icon: Info,
    className:
      "border-sky-300 bg-sky-50/80 text-sky-900 dark:bg-sky-950/20 dark:text-sky-100",
    badge: "secondary" as const,
  },
};

function sectionLabel(section: string) {
  switch (section) {
    case "info":
      return "Info";
    case "wlc":
      return "WLC";
    case "construction":
      return "Construction";
    case "energy":
      return "Energy";
    default:
      return "Project";
  }
}

export function ValidationSummaryCard({
  projectId,
  readiness,
  className,
  compact = false,
  maxItems = 5,
}: {
  projectId: string;
  readiness: ProjectReadiness;
  className?: string;
  compact?: boolean;
  maxItems?: number;
}) {
  const issues = [
    ...readiness.blockers,
    ...readiness.warnings,
    ...readiness.infos,
  ].slice(0, maxItems);

  if (issues.length === 0 && readiness.publishReady) {
    return (
      <Card
        className={cn(
          "border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20",
          className,
        )}
      >
        <CardHeader className={compact ? "pb-3" : undefined}>
          <CardTitle className="text-base">Validation summary</CardTitle>
          <CardDescription>
            This variant is publish-ready. No blockers or warnings are active.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-amber-300 bg-amber-50/70 dark:bg-amber-950/20",
        className,
      )}
    >
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Validation summary</CardTitle>
            <CardDescription>
              {readiness.blockers.length} blocker
              {readiness.blockers.length === 1 ? "" : "s"} and{" "}
              {readiness.warnings.length} warning
              {readiness.warnings.length === 1 ? "" : "s"} affect the active
              variant.
            </CardDescription>
          </div>
          <Badge variant={readiness.previewReady ? "secondary" : "outline"}>
            {readiness.previewReady ? "Preview-ready" : "Draft result"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.map((issue) => {
          const style = ISSUE_STYLES[issue.severity];
          const Icon = style.icon;

          return (
            <div
              key={issue.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-start md:justify-between",
                style.className,
              )}
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{issue.title}</span>
                    <Badge variant={style.badge}>
                      {sectionLabel(issue.section)}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-90">{issue.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href={`/projects/${projectId}/${issue.section}`} />
                }
              >
                Review
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

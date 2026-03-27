"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { VariantComparison } from "@/components/results/variant-comparison";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, GitCompare } from "lucide-react";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [view, setView] = useState<"dashboard" | "compare">("dashboard");

  const projectId = params.id;

  const { data: project } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const variantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";

  if (!variantId || !project) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  const variants = project.variants.map((v) => ({
    id: v.id,
    label: v.label === "BASE" ? "Base" : v.label.replace("_", " "),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("dashboard")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "dashboard"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="size-4" />
          Dashboard
        </button>
        {variants.length > 1 && (
          <button
            onClick={() => setView("compare")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "compare"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare className="size-4" />
            Compare Variants
          </button>
        )}
      </div>

      {view === "dashboard" ? (
        <ResultsDashboard variantId={variantId} projectId={projectId} />
      ) : (
        <VariantComparison projectId={projectId} variants={variants} />
      )}
    </div>
  );
}

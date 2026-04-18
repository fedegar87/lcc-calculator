"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectOverview } from "@/components/project/project-overview";
import {
  computeProjectReadiness,
  computeVariantDiffCount,
} from "@/lib/project-readiness";

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const projectId = params.id;
  const { data: project, isPending } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const variantQueries = useQueries({
    queries:
      project?.variants.map((variant) => ({
        ...trpc.variant.getById.queryOptions({ variantId: variant.id }),
        enabled: Boolean(project),
      })) ?? [],
  });

  const activeVariantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";
  const activeVariant = variantQueries.find(
    (query) => query.data?.id === activeVariantId
  )?.data;
  const baseVariant = variantQueries.find(
    (query) => query.data?.label === "BASE"
  )?.data;

  if (isPending || !project || !activeVariantId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!activeVariant) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const readiness = computeProjectReadiness(project, activeVariant);
  const variantLabel =
    project.variants.find((variant) => variant.id === activeVariantId)?.label ??
    "BASE";
  const diffCount =
    variantLabel === "BASE"
      ? 0
      : computeVariantDiffCount(baseVariant ?? null, activeVariant);

  return (
    <ProjectOverview
      projectId={projectId}
      variantLabel={variantLabel}
      readiness={readiness}
      diffCount={diffCount}
    />
  );
}

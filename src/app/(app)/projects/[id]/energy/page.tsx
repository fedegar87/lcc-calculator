"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { EnergyForm } from "@/components/forms/energy-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EnergyPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const projectId = params.id;

  const { data: project } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const variantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";

  if (!variantId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <EnergyForm variantId={variantId} />;
}

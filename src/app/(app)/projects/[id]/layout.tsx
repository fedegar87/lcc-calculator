"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { SaveStatusProvider, useSaveStatus } from "@/hooks/use-save-status";
import { SaveStatusBadge } from "@/components/project/save-status";
import { WizardSteps } from "@/components/project/wizard-steps";
import { VariantTabs } from "@/components/project/variant-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeProjectReadiness,
  computeVariantDiffCount,
  type ProjectStepId,
} from "@/lib/project-readiness";

function extractStep(pathname: string): ProjectStepId {
  const segments = pathname.split("/");
  return (segments[3] as ProjectStepId | undefined) ?? "overview";
}

function ProjectLayoutInner({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSaveStatus();

  const projectId = params.id;
  const trpc = useTRPC();

  const { data: project, isPending } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const activeVariantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";
  const currentStep = extractStep(pathname);
  const variantQueries = useQueries({
    queries:
      project?.variants.map((variant) => ({
        ...trpc.variant.getById.queryOptions({ variantId: variant.id }),
        enabled: Boolean(project),
      })) ?? [],
  });

  const activeVariant = variantQueries.find(
    (query) => query.data?.id === activeVariantId
  )?.data;
  const baseVariant = variantQueries.find(
    (query) => query.data?.label === "BASE"
  )?.data;
  const readiness =
    project && activeVariant
      ? computeProjectReadiness(project, activeVariant)
      : null;

  const variantsWithSummary =
    project?.variants.map((variant) => {
      const variantData = variantQueries.find(
        (query) => query.data?.id === variant.id
      )?.data;
      const variantReadiness =
        project && variantData
          ? computeProjectReadiness(project, variantData)
          : null;

      return {
        ...variant,
        readiness: variantReadiness,
        diffCount:
          variant.label === "BASE"
            ? 0
            : computeVariantDiffCount(baseVariant ?? null, variantData ?? null),
      };
    }) ?? [];

  const handleVariantChange = useCallback(
    (variantId: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set("v", variantId);
      router.push(url.pathname + url.search);
    },
    [router]
  );

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <SaveStatusBadge status={status} />
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {status === "saving"
              ? "Saving changes"
              : status === "saved"
                ? "Changes saved"
                : status === "failed"
                  ? "Saving failed"
                  : "Idle"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/help"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Help Center
          </Link>
          <WizardSteps
            projectId={projectId}
            currentStep={currentStep}
            readiness={readiness}
          />
        </div>
      </div>
      <VariantTabs
        projectId={projectId}
        variants={variantsWithSummary}
        activeVariantId={activeVariantId}
        onVariantChange={handleVariantChange}
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        {/* key forces remount on variant switch -- prevents stale data */}
        <div key={activeVariantId}>{children}</div>
      </Suspense>
    </div>
  );
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SaveStatusProvider>
      <ProjectLayoutInner>{children}</ProjectLayoutInner>
    </SaveStatusProvider>
  );
}

"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { SaveStatusProvider, useSaveStatus } from "@/hooks/use-save-status";
import { SaveStatusBadge } from "@/components/project/save-status";
import { WizardSteps } from "@/components/project/wizard-steps";
import { VariantTabs } from "@/components/project/variant-tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle } from "lucide-react";
import {
  computeProjectReadiness,
  type ProjectStepId,
} from "@/lib/project-readiness";

function extractStep(pathname: string): ProjectStepId {
  const segments = pathname.split("/");
  return (segments[3] as ProjectStepId | undefined) ?? "info";
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

  const { data: activeVariant } = useQuery({
    ...trpc.variant.getById.queryOptions({ variantId: activeVariantId }),
    enabled: Boolean(activeVariantId),
  });

  const readiness =
    project && activeVariant
      ? computeProjectReadiness(project, activeVariant)
      : null;

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
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Compact Workbook Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          {project.city && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {project.city}
              {project.country ? `, ${project.country}` : ""}
            </span>
          )}
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

        <div className="flex flex-wrap items-center gap-2.5">
          <VariantTabs
            projectId={projectId}
            variants={project.variants}
            activeVariantId={activeVariantId}
            onVariantChange={handleVariantChange}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            render={<Link href="/help" />}
          >
            <HelpCircle className="size-4" />
            <span className="hidden sm:inline">Manual & Help</span>
          </Button>
        </div>
      </div>

      {/* 4 Workbook Sheet Tabs */}
      <WizardSteps
        projectId={projectId}
        currentStep={currentStep}
        activeVariantId={activeVariantId}
        readiness={readiness}
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

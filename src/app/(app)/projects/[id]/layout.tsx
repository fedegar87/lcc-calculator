"use client";

import { Suspense, useCallback } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { SaveStatusProvider, useSaveStatus } from "@/hooks/use-save-status";
import { SaveStatusBadge } from "@/components/project/save-status";
import { WizardSteps } from "@/components/project/wizard-steps";
import { VariantTabs } from "@/components/project/variant-tabs";
import { Skeleton } from "@/components/ui/skeleton";

function extractStep(pathname: string): string {
  const segments = pathname.split("/");
  // Pattern: /projects/[id]/[step]
  return segments[3] ?? "info";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <SaveStatusBadge status={status} />
        </div>
        <WizardSteps projectId={projectId} currentStep={currentStep} />
      </div>
      <VariantTabs
        projectId={projectId}
        variants={project.variants}
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

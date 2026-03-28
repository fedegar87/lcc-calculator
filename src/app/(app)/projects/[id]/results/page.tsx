"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { VariantComparison } from "@/components/results/variant-comparison";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  GitCompare,
  FileText,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { downloadBase64File } from "@/lib/download";

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

  const activeVariant = project?.variants.find((v) => v.id === variantId);
  const variantLabel = activeVariant?.label ?? "BASE";

  const pdfMutation = useMutation(
    trpc.export.generatePdf.mutationOptions({
      onSuccess: (data) => {
        downloadBase64File(data.data, data.fileName, data.mimeType);
        toast.success("PDF exported successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Export failed");
      },
    })
  );

  const excelMutation = useMutation(
    trpc.export.generateExcel.mutationOptions({
      onSuccess: (data) => {
        downloadBase64File(data.data, data.fileName, data.mimeType);
        toast.success("Excel exported successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Export failed");
      },
    })
  );

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

        <div className="mx-2 h-5 w-px bg-border" />

        <button
          onClick={() =>
            pdfMutation.mutate({ projectId, variantLabel })
          }
          disabled={pdfMutation.isPending || !variantId}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {pdfMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Export PDF
        </button>

        <button
          onClick={() =>
            excelMutation.mutate({ projectId, variantLabel })
          }
          disabled={excelMutation.isPending || !variantId}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {excelMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-4" />
          )}
          Export Excel
        </button>
      </div>

      {view === "dashboard" ? (
        <ResultsDashboard variantId={variantId} projectId={projectId} />
      ) : (
        <VariantComparison projectId={projectId} variants={variants} />
      )}
    </div>
  );
}

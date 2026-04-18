"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { ResultsAuditView } from "@/components/results/results-audit-view";
import { VariantComparison } from "@/components/results/variant-comparison";
import { ValidationSummaryCard } from "@/components/project/validation-summary-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  GitCompare,
  Download,
  FileJson,
  ClipboardList,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { computeProjectReadiness } from "@/lib/project-readiness";

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBase64File(data: string, fileName: string, mimeType: string) {
  const binary = atob(data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsvRows(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(",")),
  ].join("\n");
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [view, setView] = useState<"dashboard" | "audit" | "compare">(
    "dashboard"
  );

  const projectId = params.id;

  const { data: project } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const variantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";

  const { data: variant } = useQuery({
    ...trpc.variant.getById.queryOptions({ variantId }),
    enabled: Boolean(variantId),
  });

  const resultQuery = useQuery({
    ...trpc.calculation.calculate.queryOptions({ variantId }),
    enabled: Boolean(variantId),
  });

  const readiness =
    project && variant ? computeProjectReadiness(project, variant) : null;
  const exportBlocked = readiness ? !readiness.previewReady : false;
  const exportBlockedTitle = exportBlocked
    ? "Resolve the blocking issues above before exporting"
    : undefined;
  const variantLabelForExport =
    project?.variants.find((variantRecord) => variantRecord.id === variantId)?.label ??
    "BASE";

  const variants = useMemo(
    () =>
      (project?.variants ?? []).map((variantRecord) => ({
        id: variantRecord.id,
        label:
          variantRecord.label === "BASE"
            ? "Base"
            : variantRecord.label.replace("_", " "),
      })),
    [project?.variants]
  );

  const activeVariantLabel =
    variants.find((variantRecord) => variantRecord.id === variantId)?.label ??
    "Variant";
  const exportPdf = useMutation(
    trpc.export.generatePdf.mutationOptions({
      onSuccess: (payload) => {
        downloadBase64File(payload.data, payload.fileName, payload.mimeType);
        toast.success("PDF export ready.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
  const exportExcel = useMutation(
    trpc.export.generateExcel.mutationOptions({
      onSuccess: (payload) => {
        downloadBase64File(payload.data, payload.fileName, payload.mimeType);
        toast.success("Excel export ready.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const exportRows =
    resultQuery.data == null
      ? []
      : [
          { Metric: "LCC", Amount: resultQuery.data.lcc },
          { Metric: "WLC", Amount: resultQuery.data.wlc },
          { Metric: "Design costs", Amount: resultQuery.data.designCosts },
          {
            Metric: "Construction",
            Amount: resultQuery.data.totalConstruction,
          },
          {
            Metric: "Operation and maintenance",
            Amount: resultQuery.data.operationAndMaintenance,
          },
          {
            Metric: "Non-construction",
            Amount: resultQuery.data.nonConstructionCosts,
          },
          {
            Metric: "Residual value",
            Amount: resultQuery.data.residualValue,
          },
          {
            Metric: "LCC net residual",
            Amount: resultQuery.data.lccNetResidual,
          },
        ];

  function handleExportJson() {
    if (!resultQuery.data) {
      toast.error("Run a calculation first.");
      return;
    }

    downloadTextFile(
      JSON.stringify(resultQuery.data, null, 2),
      `${project?.name ?? "project"}-${activeVariantLabel.toLowerCase().replaceAll(" ", "-")}-results.json`,
      "application/json"
    );
  }

  function handleExportCsv() {
    if (exportRows.length === 0) {
      toast.error("Run a calculation first.");
      return;
    }

    downloadTextFile(
      toCsvRows(exportRows),
      `${project?.name ?? "project"}-${activeVariantLabel.toLowerCase().replaceAll(" ", "-")}-results.csv`,
      "text/csv;charset=utf-8"
    );
  }

  function handleExportPdf() {
    exportPdf.mutate({
      projectId,
      variantLabel: variantLabelForExport as "BASE" | "VARIANT_1" | "VARIANT_2",
      formulaMode: "excel_bugfixed",
    });
  }

  function handleExportExcel() {
    exportExcel.mutate({
      projectId,
      variantLabel: variantLabelForExport as "BASE" | "VARIANT_1" | "VARIANT_2",
      formulaMode: "excel_bugfixed",
    });
  }

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

  return (
    <div className="space-y-4">
      {readiness ? (
        <ValidationSummaryCard projectId={projectId} readiness={readiness} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
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
        <button
          onClick={() => setView("audit")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "audit"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="size-4" />
          Audit
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

        <div className="mx-2 hidden h-5 w-px bg-border sm:block" />

        <button
          onClick={handleExportPdf}
          disabled={exportPdf.isPending || exportBlocked}
          title={exportBlockedTitle}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <FileText className="size-4" />
          {exportPdf.isPending ? "Exporting PDF..." : "Export PDF"}
        </button>
        <button
          onClick={handleExportExcel}
          disabled={exportExcel.isPending || exportBlocked}
          title={exportBlockedTitle}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <FileSpreadsheet className="size-4" />
          {exportExcel.isPending ? "Exporting Excel..." : "Export Excel"}
        </button>
        <button
          onClick={handleExportCsv}
          disabled={!resultQuery.data || exportBlocked}
          title={exportBlockedTitle}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Download className="size-4" />
          Export CSV
        </button>
        <button
          onClick={handleExportJson}
          disabled={!resultQuery.data || exportBlocked}
          title={exportBlockedTitle}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <FileJson className="size-4" />
          Export JSON
        </button>
      </div>

      {view === "dashboard" ? (
        <ResultsDashboard
          variantId={variantId}
          projectId={projectId}
          resultOverride={resultQuery.data}
        />
      ) : view === "audit" ? (
        resultQuery.data ? (
          <ResultsAuditView result={resultQuery.data} />
        ) : (
          <ResultsDashboard variantId={variantId} projectId={projectId} />
        )
      ) : (
        <VariantComparison projectId={projectId} variants={variants} />
      )}
    </div>
  );
}

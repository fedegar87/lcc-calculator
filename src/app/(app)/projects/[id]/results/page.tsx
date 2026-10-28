"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  BarChart3,
  GitCompare,
  Download,
  FileJson,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  Settings2,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { FormulaMode } from "@/engine/types";

const ResultsAuditView = dynamic(() =>
  import("@/components/results/results-audit-view").then(
    (module) => module.ResultsAuditView
  )
);

const VariantComparison = dynamic(() =>
  import("@/components/results/variant-comparison").then(
    (module) => module.VariantComparison
  )
);

const SensitivityView = dynamic(() =>
  import("@/components/results/sensitivity-view").then(
    (module) => module.SensitivityView
  )
);

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
    ...rows.map((row) =>
      headers.map((header) => escapeValue(row[header])).join(",")
    ),
  ].join("\n");
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [view, setView] = useState<
    "dashboard" | "compare" | "audit" | "sensitivity"
  >("dashboard");
  const [formulaMode, setFormulaMode] =
    useState<FormulaMode>("excel_bugfixed");

  const projectId = params.id;

  const { data: project } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const variantId = searchParams.get("v") ?? project?.variants[0]?.id ?? "";

  const resultQuery = useQuery({
    ...trpc.calculation.calculate.queryOptions({ variantId, formulaMode }),
    enabled: Boolean(variantId),
  });

  const variantLabelForExport =
    project?.variants.find((variantRecord) => variantRecord.id === variantId)
      ?.label ?? "BASE";

  const variants = useMemo(
    () =>
      (project?.variants ?? []).map((variantRecord) => ({
        id: variantRecord.id,
        label:
          variantRecord.label === "BASE"
            ? "Base Case"
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
        toast.success("PDF report downloaded.");
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
        toast.success("Excel workbook downloaded.");
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
            Metric: "Formula mode",
            Amount: formulaMode,
          },
          {
            Metric: "Method profile",
            Amount: resultQuery.data.methodProfile,
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
      toast.error("No calculation data available.");
      return;
    }

    downloadTextFile(
      JSON.stringify(resultQuery.data, null, 2),
      `${project?.name ?? "project"}-${activeVariantLabel.toLowerCase().replaceAll(" ", "-")}-${formulaMode}-results.json`,
      "application/json"
    );
  }

  function handleExportCsv() {
    if (exportRows.length === 0) {
      toast.error("No calculation data available.");
      return;
    }

    downloadTextFile(
      toCsvRows(exportRows),
      `${project?.name ?? "project"}-${activeVariantLabel.toLowerCase().replaceAll(" ", "-")}-${formulaMode}-results.csv`,
      "text/csv;charset=utf-8"
    );
  }

  function handleExportPdf() {
    exportPdf.mutate({
      projectId,
      variantLabel: variantLabelForExport as "BASE" | "VARIANT_1" | "VARIANT_2",
      formulaMode,
    });
  }

  function handleExportExcel() {
    exportExcel.mutate({
      projectId,
      variantLabel: variantLabelForExport as "BASE" | "VARIANT_1" | "VARIANT_2",
      formulaMode,
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
      {/* Clean Results Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setView("dashboard")}
            variant={view === "dashboard" ? "default" : "outline"}
            size="sm"
          >
            <BarChart3 className="size-4" />
            Summary & Charts
          </Button>

          {variants.length > 1 && (
            <Button
              type="button"
              onClick={() => setView("compare")}
              variant={view === "compare" ? "default" : "outline"}
              size="sm"
            >
              <GitCompare className="size-4" />
              Compare Scenarios ({variants.length})
            </Button>
          )}

          {(view === "audit" || view === "sensitivity") && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {view === "audit" ? (
                <>
                  <ClipboardList className="size-3.5" />
                  Formula Audit View
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Sensitivity Analysis
                </>
              )}
              <button
                type="button"
                onClick={() => setView("dashboard")}
                className="ml-1 underline hover:no-underline"
              >
                Back to Summary
              </button>
            </span>
          )}
        </div>

        {/* Export & Advanced Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleExportExcel}
            disabled={exportExcel.isPending || !resultQuery.data}
            variant="outline"
            size="sm"
          >
            <FileSpreadsheet className="size-4" />
            {exportExcel.isPending ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            type="button"
            onClick={handleExportPdf}
            disabled={exportPdf.isPending || !resultQuery.data}
            variant="outline"
            size="sm"
          >
            <FileText className="size-4" />
            {exportPdf.isPending ? "Exporting..." : "Export PDF"}
          </Button>

          {/* Advanced / Research Tools Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" />}
            >
              <Settings2 className="size-4" />
              <span>Advanced</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Analysis Views</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setView("audit")}>
                  <ClipboardList className="mr-2 size-4" />
                  Formula Audit Tree
                  {view === "audit" && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("sensitivity")}>
                  <Sparkles className="mr-2 size-4" />
                  Sensitivity Analysis (DSA/EE)
                  {view === "sensitivity" && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Calculation Engine</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setFormulaMode("excel_bugfixed")}
                >
                  Standard ISO 15686-5 (Bugfixed)
                  {formulaMode === "excel_bugfixed" && (
                    <Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormulaMode("excel_replica")}
                >
                  Exact Legacy Excel Replica
                  {formulaMode === "excel_replica" && (
                    <Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Raw Data Export</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleExportCsv}
                  disabled={!resultQuery.data}
                >
                  <Download className="mr-2 size-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportJson}
                  disabled={!resultQuery.data}
                >
                  <FileJson className="mr-2 size-4" />
                  Download JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ErrorBoundary
        key={`${variantId}-${view}`}
        fallbackTitle="Results view failed to render"
        onRetry={() => resultQuery.refetch()}
      >
        {view === "dashboard" ? (
          <ResultsDashboard
            variantId={variantId}
            projectId={projectId}
            formulaMode={formulaMode}
            resultOverride={resultQuery.data ?? null}
            skipQuery
            loadingOverride={resultQuery.isPending}
            errorOverride={resultQuery.error}
            onRetryOverride={() => {
              resultQuery.refetch();
            }}
          />
        ) : view === "audit" ? (
          resultQuery.data ? (
            <ResultsAuditView result={resultQuery.data} />
          ) : (
            <ResultsDashboard
              variantId={variantId}
              projectId={projectId}
              formulaMode={formulaMode}
              skipQuery
              loadingOverride={resultQuery.isPending}
              errorOverride={resultQuery.error}
              onRetryOverride={() => {
                resultQuery.refetch();
              }}
            />
          )
        ) : view === "compare" ? (
          <VariantComparison
            projectId={projectId}
            variants={variants}
            formulaMode={formulaMode}
          />
        ) : (
          <SensitivityView
            projectId={projectId}
            variantId={variantId}
            formulaMode={formulaMode}
          />
        )}
      </ErrorBoundary>

      <div className="flex items-center justify-start pt-2 print:hidden">
        <Button
          variant="outline"
          render={
            <Link
              href={`/projects/${projectId}/construction?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          <ArrowLeft className="mr-1.5 size-4" />
          3. Costs & Maintenance
        </Button>
      </div>
    </div>
  );
}

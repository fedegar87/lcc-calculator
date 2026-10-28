"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useSaveStatus } from "@/hooks/use-save-status";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { SliderInput } from "@/components/shared/slider-input";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
import { NumberInput } from "@/components/forms/shared/number-input";
import { EN15459Combobox } from "@/components/forms/shared/en15459-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { UNITS } from "@/lib/units";
import { cn } from "@/lib/utils";

// -- Types --

interface CostItemDetail {
  id: string;
  costItemId: string;
  layerOrder: number;
  description: string | null;
  area: number;
  materialCost: number;
  unitPrice: number;
  laborCost: number;
  otherCost: number;
}

interface CostItem {
  id: string;
  variantId: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  materialCostAgg: number;
  laborCostAgg: number;
  otherCostAgg: number;
  details: CostItemDetail[];
}

interface ServiceComponent {
  id: string;
  variantId: string;
  name: string;
  constructionCost: number;
  en15459ComponentIndex: number;
  sortOrder: number;
}

interface CategoryDef {
  value: string;
  label: string;
  group: string;
}

// -- Schemas --

const maintenanceSchema = z.object({
  buildingElementMaintenancePercent: z.number().min(0).max(100),
});

type MaintenanceValues = z.infer<typeof maintenanceSchema>;

const wlcInputSchema = z.object({
  landCostMode: z.enum(["UNIT_PRICE", "TOTAL_COST"]),
  landArea: z.number().nullable().optional(),
  buildingIndex: z.number().nullable().optional(),
  floorHeight: z.number().nullable().optional(),
  landPrice: z.number().nullable().optional(),
  landCostTotal: z.number().nullable().optional(),
  enablingCost1: z.number().nullable().optional(),
  enablingCost2: z.number().nullable().optional(),
  planningFees1: z.number().nullable().optional(),
  planningFees2: z.number().nullable().optional(),
  userSupportPropMgmt: z.number().nullable().optional(),
  userSupportCharges: z.number().nullable().optional(),
  userSupportAdmin: z.number().nullable().optional(),
  financeCost: z.number().nullable().optional(),
});

type WLCInputValues = z.infer<typeof wlcInputSchema>;

const designCostRowSchema = z.object({
  lineNumber: z.number().int(),
  description: z.string(),
  preliminaryCost: z.number().optional(),
  definitiveCost: z.number().optional(),
  executiveCost: z.number().optional(),
  siteManagementCost: z.number().optional(),
});

const designCostsSchema = z.object({
  costs: z.array(designCostRowSchema),
});

type DesignCostsValues = z.infer<typeof designCostsSchema>;

function formatCurrency(val: number, decimals = 0): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getEffectiveCategoryCosts(costItem: CostItem | undefined) {
  if (!costItem) {
    return { material: 0, labor: 0, other: 0, total: 0, hasDetails: false };
  }
  const details = costItem.details ?? [];
  if (details.length > 0) {
    const material = details.reduce(
      (sum, d) => sum + Math.max(d.materialCost, d.unitPrice * d.area),
      0
    );
    const labor = details.reduce((sum, d) => sum + d.laborCost, 0);
    const other = details.reduce((sum, d) => sum + d.otherCost, 0);
    return {
      material,
      labor,
      other,
      total: material + labor + other,
      hasDetails: true,
    };
  }
  const material = costItem.materialCostAgg ?? 0;
  const labor = costItem.laborCostAgg ?? 0;
  const other = costItem.otherCostAgg ?? 0;
  return {
    material,
    labor,
    other,
    total: material + labor + other,
    hasDetails: false,
  };
}

// -- Detail Layer Row --

function DetailLayerRow({
  detail,
  onUpdate,
  onDelete,
}: {
  detail: CostItemDetail;
  onUpdate: (field: string, value: number | string) => void;
  onDelete: () => void;
}) {
  const resolvedMaterial = Math.max(
    detail.materialCost,
    detail.unitPrice * detail.area
  );
  const rowTotal = resolvedMaterial + detail.laborCost + detail.otherCost;

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-background p-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_90px_105px_115px_115px_100px_100px_32px] lg:items-center">
      <Input
        defaultValue={detail.description ?? ""}
        placeholder="Layer / item description"
        className="h-8 text-xs"
        onBlur={(e) => onUpdate("description", e.target.value)}
      />
      <NumericFormat
        value={detail.area || ""}
        onValueChange={(v) => onUpdate("area", v.floatValue ?? 0)}
        decimalScale={2}
        placeholder={`Area (${UNITS.m2})`}
        customInput={Input}
        className="h-8 text-right text-xs tabular-nums"
        aria-label="Area"
      />
      <NumericFormat
        value={detail.unitPrice || ""}
        onValueChange={(v) => onUpdate("unitPrice", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        placeholder="Unit €/m²"
        customInput={Input}
        className="h-8 text-right text-xs tabular-nums"
        aria-label="Unit price"
      />
      <NumericFormat
        value={detail.materialCost || ""}
        onValueChange={(v) => onUpdate("materialCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        placeholder="Material (€)"
        customInput={Input}
        className="h-8 text-right text-xs tabular-nums"
        aria-label="Material cost"
      />
      <NumericFormat
        value={detail.laborCost || ""}
        onValueChange={(v) => onUpdate("laborCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        placeholder="Labor (€)"
        customInput={Input}
        className="h-8 text-right text-xs tabular-nums"
        aria-label="Labor cost"
      />
      <NumericFormat
        value={detail.otherCost || ""}
        onValueChange={(v) => onUpdate("otherCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        placeholder="Other (€)"
        customInput={Input}
        className="h-8 text-right text-xs tabular-nums"
        aria-label="Other cost"
      />
      <div className="text-right text-xs font-medium tabular-nums">
        €{formatCurrency(rowTotal)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Delete layer"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

// -- Main Construction & WLC Form --

interface ConstructionFormProps {
  variantId: string;
}

export function ConstructionForm({ variantId }: ConstructionFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { setStatus } = useSaveStatus();

  const initialSection = searchParams.get("section");
  const [activeTab, setActiveTab] = useState<
    "all" | "construction" | "maintenance" | "wlc"
  >(initialSection === "wlc" ? "wlc" : "all");

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const pendingUpdates = useRef<
    Record<string, Record<string, number | string>>
  >({});
  const aggDebounceTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  // Fetch reference categories
  const { data: categories = [] } = useQuery(
    trpc.reference.costCategories.queryOptions()
  );

  // Fetch variant
  const { data: variant, isPending: variantPending } = useQuery(
    trpc.variant.getById.queryOptions({ variantId })
  );

  // Fetch cost items
  const { data: costItems = [], isPending: costItemsPending } = useQuery(
    trpc.costItem.listByVariant.queryOptions({ variantId })
  );

  const serviceComponents = useMemo(
    () => variant?.serviceComponents ?? [],
    [variant?.serviceComponents]
  );

  const invalidateCalculationState = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.variant.getById.queryKey({ variantId }),
    });
    if (variant?.projectId) {
      queryClient.invalidateQueries({
        queryKey: trpc.project.getById.queryKey({
          projectId: variant.projectId,
        }),
      });
    }
    for (const formulaMode of ["excel_bugfixed", "excel_replica"] as const) {
      queryClient.invalidateQueries({
        queryKey: trpc.calculation.calculate.queryKey({
          variantId,
          formulaMode,
        }),
      });
    }
  }, [queryClient, trpc, variant?.projectId, variantId]);

  // -- Mutations --

  const upsertCostItem = useMutation(
    trpc.costItem.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
        invalidateCalculationState();
        setStatus("saved");
      },
      onError: () => {
        setStatus("failed");
        toast.error("Failed to save category cost");
      },
    })
  );

  const upsertDetail = useMutation(
    trpc.costItem.upsertDetail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
        invalidateCalculationState();
        setStatus("saved");
      },
      onError: () => {
        setStatus("failed");
        toast.error("Failed to save layer detail");
      },
    })
  );

  const deleteDetail = useMutation(
    trpc.costItem.deleteDetail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
        invalidateCalculationState();
        setStatus("saved");
      },
      onError: () => {
        toast.error("Failed to delete layer");
      },
    })
  );

  const upsertServiceComponent = useMutation(
    trpc.variant.upsertServiceComponent.mutationOptions({
      onSuccess: () => {
        invalidateCalculationState();
        setStatus("saved");
      },
      onError: () => {
        setStatus("failed");
        toast.error("Failed to save service component");
      },
    })
  );

  const deleteServiceComponent = useMutation(
    trpc.variant.deleteServiceComponent.mutationOptions({
      onSuccess: () => {
        invalidateCalculationState();
        setStatus("saved");
      },
      onError: () => {
        toast.error("Failed to delete service component");
      },
    })
  );

  // -- Aggregate Cost Handler (Debounced) --

  const handleAggregateUpdate = useCallback(
    (
      category: string,
      field: "materialCostAgg" | "laborCostAgg",
      value: number
    ) => {
      const existing = costItems.find((ci) => ci.category === category);
      const currentMat = existing?.materialCostAgg ?? 0;
      const currentLab = existing?.laborCostAgg ?? 0;
      const nextMat = field === "materialCostAgg" ? value : currentMat;
      const nextLab = field === "laborCostAgg" ? value : currentLab;

      clearTimeout(aggDebounceTimers.current[category]);
      aggDebounceTimers.current[category] = setTimeout(() => {
        setStatus("saving");
        upsertCostItem.mutate({
          variantId,
          category: category as Parameters<
            typeof upsertCostItem.mutate
          >[0]["category"],
          materialCostAgg: nextMat,
          laborCostAgg: nextLab,
        });
      }, 450);
    },
    [costItems, setStatus, upsertCostItem, variantId]
  );

  // -- Detail Layer Handlers --

  const handleDetailUpdate = useCallback(
    (
      costItemId: string,
      detailId: string,
      field: string,
      value: number | string
    ) => {
      const key = detailId;
      if (!pendingUpdates.current[key]) {
        pendingUpdates.current[key] = {};
      }
      pendingUpdates.current[key][field] = value;

      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        const updates = pendingUpdates.current[key];
        if (!updates) return;
        delete pendingUpdates.current[key];

        setStatus("saving");
        upsertDetail.mutate({
          costItemId,
          detailId,
          layerOrder: 0,
          ...updates,
        });
      }, 450);
    },
    [setStatus, upsertDetail]
  );

  const handleDetailDelete = useCallback(
    (_costItemId: string, detailId: string) => {
      clearTimeout(debounceTimers.current[detailId]);
      delete pendingUpdates.current[detailId];
      deleteDetail.mutate({ detailId });
    },
    [deleteDetail]
  );

  const handleDetailAdd = useCallback(
    async (category: string) => {
      const existing = costItems.find((ci) => ci.category === category);
      let costItemId: string;
      let maxOrder = 0;
      let seedMat = 0;
      let seedLab = 0;

      if (existing) {
        costItemId = existing.id;
        const details = existing.details ?? [];
        maxOrder = details.length
          ? Math.max(0, ...details.map((d) => d.layerOrder))
          : 0;
        if (
          details.length === 0 &&
          (existing.materialCostAgg > 0 || existing.laborCostAgg > 0)
        ) {
          seedMat = existing.materialCostAgg;
          seedLab = existing.laborCostAgg;
        }
      } else {
        const created = await upsertCostItem.mutateAsync({
          variantId,
          category: category as Parameters<
            typeof upsertCostItem.mutateAsync
          >[0]["category"],
        });
        costItemId = created.id;
      }

      setExpandedCategories((prev) => ({ ...prev, [category]: true }));
      upsertDetail.mutate({
        costItemId,
        layerOrder: maxOrder + 1,
        description: seedMat > 0 || seedLab > 0 ? "Main assembly" : "",
        materialCost: seedMat,
        laborCost: seedLab,
      });
    },
    [costItems, upsertCostItem, upsertDetail, variantId]
  );

  // -- Service Component Handlers --

  const handleServiceComponentUpdate = useCallback(
    (componentId: string, field: string, value: number | string) => {
      const existing = serviceComponents.find((sc) => sc.id === componentId);
      if (!existing) return;

      setStatus("saving");
      upsertServiceComponent.mutate({
        variantId,
        componentId,
        name: field === "name" ? String(value) : existing.name,
        constructionCost:
          field === "constructionCost"
            ? Number(value)
            : existing.constructionCost,
        en15459ComponentIndex:
          field === "en15459ComponentIndex"
            ? Number(value)
            : existing.en15459ComponentIndex,
        sortOrder: existing.sortOrder,
      });
    },
    [variantId, serviceComponents, setStatus, upsertServiceComponent]
  );

  const handleServiceComponentDelete = useCallback(
    (componentId: string) => {
      deleteServiceComponent.mutate({ componentId });
    },
    [deleteServiceComponent]
  );

  const handleServiceComponentAdd = useCallback(() => {
    upsertServiceComponent.mutate({
      variantId,
      name: "New service component",
      constructionCost: 0,
      en15459ComponentIndex: 1,
    });
  }, [variantId, upsertServiceComponent]);

  useEffect(() => {
    const timers = debounceTimers.current;
    const aggTimers = aggDebounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      Object.values(aggTimers).forEach(clearTimeout);
    };
  }, []);

  // -- Totals Calculation --

  const treatedFloorArea = variant?.geometry?.treatedFloorArea ?? 0;

  const summary = useMemo(() => {
    let totalMaterials = 0;
    let totalLabor = 0;
    let totalOther = 0;
    let groupATotal = 0;

    for (const ci of costItems) {
      const eff = getEffectiveCategoryCosts(ci);
      totalMaterials += eff.material;
      totalLabor += eff.labor;
      totalOther += eff.other;
      if (ci.category.startsWith("A")) {
        groupATotal += eff.total;
      }
    }

    const totalConstruction = totalMaterials + totalLabor + totalOther;
    return {
      totalMaterials,
      totalLabor,
      totalOther,
      totalConstruction,
      groupATotal,
      perM2: treatedFloorArea > 0 ? totalConstruction / treatedFloorArea : 0,
    };
  }, [costItems, treatedFloorArea]);

  if (costItemsPending || variantPending || !variant) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const groups = categories.reduce<Record<string, CategoryDef[]>>((acc, cat) => {
    const group = cat.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat as CategoryDef);
    return acc;
  }, {});

  const GROUP_ORDER = [
    { key: "Building Elements", code: "A", title: "A — Building Elements (Envelope & Structure)" },
    { key: "Building Services", code: "B", title: "B — Building Services (HVAC, DHW, Electrical)" },
    { key: "Renewable Energy", code: "C", title: "C — Renewable Energy Systems (RES)" },
    { key: "Furnishings", code: "D", title: "D — Other Installations & Equipment" },
    { key: "Outdoor", code: "E", title: "E — Site & External Works" },
  ];

  const projectId = variant.projectId;

  return (
    <div className="space-y-6">
      {/* Live Cost Summary Bar & Sub-Navigation */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total Construction (A–E)
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums">
                  €{formatCurrency(summary.totalConstruction)}
                </span>
                {treatedFloorArea > 0 && (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    ({formatCurrency(summary.perM2, 0)} {UNITS.EUR_m2})
                  </span>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Materials: </span>
                <strong className="tabular-nums">
                  €{formatCurrency(summary.totalMaterials)}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Labor: </span>
                <strong className="tabular-nums">
                  €{formatCurrency(summary.totalLabor)}
                </strong>
              </div>
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className="inline-flex flex-wrap rounded-lg border bg-muted/40 p-1 text-xs">
            {(
              [
                ["all", "All Sections"],
                ["construction", "1. Construction (A–E)"],
                ["maintenance", "2. Maintenance (EN 15459)"],
                ["wlc", "3. WLC (Land & Design)"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  activeTab === id
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* SECTION 1: Construction Costs Table (A-E) */}
      {(activeTab === "all" || activeTab === "construction") && (
        <GlassCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Construction Costs Breakdown (ISO 15686-5 / CEEC)
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter aggregated <strong>Materials (€)</strong> and{" "}
                <strong>Labor (€)</strong> directly in the table, or click{" "}
                <strong>Layers</strong> on any row if you want to break a
                category down into individual stratigraphy layers.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHideEmptyCategories((v) => !v)}
            >
              {hideEmptyCategories
                ? "Show all 21 categories"
                : "Show only non-zero categories"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">
                    Category (Code & Name)
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    Materials (€)
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    Labor (€)
                  </TableHead>
                  <TableHead className="w-[140px] text-right">
                    Total (€)
                  </TableHead>
                  <TableHead className="w-[110px] text-right">
                    {UNITS.EUR_m2}
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Detail Layers
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GROUP_ORDER.map((groupInfo) => {
                  const groupCats = groups[groupInfo.key] ?? [];
                  const visibleCats = hideEmptyCategories
                    ? groupCats.filter((cat) => {
                        const ci = costItems.find(
                          (item) => item.category === cat.value
                        );
                        return getEffectiveCategoryCosts(ci).total > 0;
                      })
                    : groupCats;

                  if (visibleCats.length === 0) return null;

                  const groupTotals = groupCats.reduce(
                    (acc, cat) => {
                      const ci = costItems.find(
                        (item) => item.category === cat.value
                      );
                      const eff = getEffectiveCategoryCosts(ci);
                      return {
                        mat: acc.mat + eff.material,
                        lab: acc.lab + eff.labor,
                        tot: acc.tot + eff.total,
                      };
                    },
                    { mat: 0, lab: 0, tot: 0 }
                  );

                  return (
                    <GroupRows
                      key={groupInfo.key}
                      groupTitle={groupInfo.title}
                      groupTotals={groupTotals}
                      categories={visibleCats}
                      costItems={costItems}
                      treatedFloorArea={treatedFloorArea}
                      expandedCategories={expandedCategories}
                      onToggleExpand={(catVal) =>
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [catVal]: !prev[catVal],
                        }))
                      }
                      onAggregateUpdate={handleAggregateUpdate}
                      onDetailAdd={handleDetailAdd}
                      onDetailUpdate={handleDetailUpdate}
                      onDetailDelete={handleDetailDelete}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* SECTION 2: Maintenance & Service Components (EN 15459) */}
      {(activeTab === "all" || activeTab === "maintenance") && (
        <div className="space-y-6">
          <MaintenanceConfigSection
            variantId={variantId}
            projectId={projectId}
            initialPercent={
              variant.maintenanceConfig?.buildingElementMaintenancePercent ??
              0.01
            }
            groupAConstructionTotal={summary.groupATotal}
          />

          <ServiceComponentsSection
            serviceComponents={serviceComponents}
            onServiceComponentUpdate={handleServiceComponentUpdate}
            onServiceComponentDelete={handleServiceComponentDelete}
            onServiceComponentAdd={handleServiceComponentAdd}
          />
        </div>
      )}

      {/* SECTION 3: WLC (Land, Non-Construction & Design Costs) */}
      {(activeTab === "all" || activeTab === "wlc") && (
        <div className="space-y-6">
          <NonConstructionSection
            variant={variant}
            variantId={variantId}
            projectId={projectId}
          />
          <DesignCostsSection
            variant={variant}
            variantId={variantId}
            projectId={projectId}
          />
        </div>
      )}

      {/* Step Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          render={
            <Link
              href={`/projects/${projectId}/energy?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          <ArrowLeft className="mr-1.5 size-4" />
          2. Energy & Economy
        </Button>
        <Button
          render={
            <Link
              href={`/projects/${projectId}/results?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          Next: 4. Results & Charts
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  );
}

// -- Group Rows Helper --

function GroupRows({
  groupTitle,
  groupTotals,
  categories,
  costItems,
  treatedFloorArea,
  expandedCategories,
  onToggleExpand,
  onAggregateUpdate,
  onDetailAdd,
  onDetailUpdate,
  onDetailDelete,
}: {
  groupTitle: string;
  groupTotals: { mat: number; lab: number; tot: number };
  categories: CategoryDef[];
  costItems: CostItem[];
  treatedFloorArea: number;
  expandedCategories: Record<string, boolean>;
  onToggleExpand: (category: string) => void;
  onAggregateUpdate: (
    category: string,
    field: "materialCostAgg" | "laborCostAgg",
    value: number
  ) => void;
  onDetailAdd: (category: string) => void;
  onDetailUpdate: (
    costItemId: string,
    detailId: string,
    field: string,
    value: number | string
  ) => void;
  onDetailDelete: (costItemId: string, detailId: string) => void;
}) {
  return (
    <>
      {/* Group Header Row */}
      <TableRow className="bg-muted/45 hover:bg-muted/45">
        <TableCell className="py-2 text-xs font-bold uppercase tracking-wide text-foreground">
          {groupTitle}
        </TableCell>
        <TableCell className="py-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          €{formatCurrency(groupTotals.mat)}
        </TableCell>
        <TableCell className="py-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          €{formatCurrency(groupTotals.lab)}
        </TableCell>
        <TableCell className="py-2 text-right text-xs font-bold tabular-nums text-foreground">
          €{formatCurrency(groupTotals.tot)}
        </TableCell>
        <TableCell className="py-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          {treatedFloorArea > 0
            ? formatCurrency(groupTotals.tot / treatedFloorArea, 1)
            : "—"}
        </TableCell>
        <TableCell className="py-2" />
      </TableRow>

      {/* Category Rows */}
      {categories.map((cat) => {
        const ci = costItems.find((item) => item.category === cat.value);
        const eff = getEffectiveCategoryCosts(ci);
        const detailCount = ci?.details?.length ?? 0;
        const isExpanded = Boolean(expandedCategories[cat.value]);
        const perM2 =
          treatedFloorArea > 0 && eff.total > 0
            ? eff.total / treatedFloorArea
            : 0;

        return (
          <CategoryTableRow
            key={cat.value}
            category={cat}
            costItem={ci}
            effective={eff}
            detailCount={detailCount}
            perM2={perM2}
            isExpanded={isExpanded}
            onToggleExpand={() => onToggleExpand(cat.value)}
            onAggregateUpdate={onAggregateUpdate}
            onDetailAdd={onDetailAdd}
            onDetailUpdate={onDetailUpdate}
            onDetailDelete={onDetailDelete}
          />
        );
      })}
    </>
  );
}

function CategoryTableRow({
  category,
  costItem,
  effective,
  detailCount,
  perM2,
  isExpanded,
  onToggleExpand,
  onAggregateUpdate,
  onDetailAdd,
  onDetailUpdate,
  onDetailDelete,
}: {
  category: CategoryDef;
  costItem: CostItem | undefined;
  effective: {
    material: number;
    labor: number;
    other: number;
    total: number;
    hasDetails: boolean;
  };
  detailCount: number;
  perM2: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAggregateUpdate: (
    category: string,
    field: "materialCostAgg" | "laborCostAgg",
    value: number
  ) => void;
  onDetailAdd: (category: string) => void;
  onDetailUpdate: (
    costItemId: string,
    detailId: string,
    field: string,
    value: number | string
  ) => void;
  onDetailDelete: (costItemId: string, detailId: string) => void;
}) {
  return (
    <>
      <TableRow
        className={cn(
          effective.total > 0 ? "bg-card" : "text-muted-foreground"
        )}
      >
        <TableCell className="font-medium text-sm">
          <span>{category.label}</span>
        </TableCell>

        {/* Materials (€) */}
        <TableCell className="text-right">
          {effective.hasDetails ? (
            <div className="inline-flex items-center justify-end gap-1.5 px-2 text-sm font-medium tabular-nums">
              <span>{formatCurrency(effective.material)}</span>
              <Badge variant="secondary" className="text-[10px]">
                Layers
              </Badge>
            </div>
          ) : (
            <NumericFormat
              value={effective.material || ""}
              onValueChange={(vals) => {
                const next = vals.floatValue ?? 0;
                if (next !== effective.material) {
                  onAggregateUpdate(category.value, "materialCostAgg", next);
                }
              }}
              thousandSeparator=","
              decimalScale={0}
              placeholder="0"
              customInput={Input}
              className="ml-auto h-8 w-36 text-right text-sm tabular-nums"
              aria-label={`${category.label} materials cost`}
            />
          )}
        </TableCell>

        {/* Labor (€) */}
        <TableCell className="text-right">
          {effective.hasDetails ? (
            <div className="px-2 text-sm font-medium tabular-nums">
              {formatCurrency(effective.labor)}
            </div>
          ) : (
            <NumericFormat
              value={effective.labor || ""}
              onValueChange={(vals) => {
                const next = vals.floatValue ?? 0;
                if (next !== effective.labor) {
                  onAggregateUpdate(category.value, "laborCostAgg", next);
                }
              }}
              thousandSeparator=","
              decimalScale={0}
              placeholder="0"
              customInput={Input}
              className="ml-auto h-8 w-36 text-right text-sm tabular-nums"
              aria-label={`${category.label} labor cost`}
            />
          )}
        </TableCell>

        {/* Total (€) */}
        <TableCell className="text-right text-sm font-semibold tabular-nums">
          {effective.total > 0 ? `€${formatCurrency(effective.total)}` : "—"}
        </TableCell>

        {/* Specific (€/m²) */}
        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
          {perM2 > 0 ? formatCurrency(perM2, 1) : "—"}
        </TableCell>

        {/* Optional Detail Layers Button */}
        <TableCell className="text-right">
          <Button
            type="button"
            variant={detailCount > 0 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="mr-1 size-3.5" />
            ) : (
              <ChevronRight className="mr-1 size-3.5" />
            )}
            <Layers className="mr-1 size-3" />
            {detailCount > 0 ? `Layers (${detailCount})` : "Layers"}
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded Stratigraphy / Detail Layers Drawer */}
      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={6} className="p-3">
            <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  <strong>{category.label} — Detailed Layers:</strong> Use
                  layers when you want to compute material cost from{" "}
                  <code>Area × Unit Price</code> or list individual assemblies.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onDetailAdd(category.value)}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Layer
                </Button>
              </div>

              {costItem && costItem.details.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="hidden grid-cols-[minmax(180px,1fr)_90px_105px_115px_115px_100px_100px_32px] gap-2 px-2.5 text-[11px] font-medium text-muted-foreground lg:grid">
                    <span>Description</span>
                    <span className="text-right">Area ({UNITS.m2})</span>
                    <span className="text-right">Unit (€/m²)</span>
                    <span className="text-right">Material (€)</span>
                    <span className="text-right">Labor (€)</span>
                    <span className="text-right">Other (€)</span>
                    <span className="text-right">Layer Total</span>
                    <span />
                  </div>
                  {costItem.details.map((det) => (
                    <DetailLayerRow
                      key={det.id}
                      detail={det}
                      onUpdate={(field, value) =>
                        onDetailUpdate(costItem.id, det.id, field, value)
                      }
                      onDelete={() => onDetailDelete(costItem.id, det.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No detail layers added. This category uses the direct
                  Materials and Labor totals entered in the row above.
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// -- Maintenance Config Section --

function MaintenanceConfigSection({
  variantId,
  projectId,
  initialPercent,
  groupAConstructionTotal,
}: {
  variantId: string;
  projectId: string;
  initialPercent: number;
  groupAConstructionTotal: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertMC = useMutation(
    trpc.variant.upsertMaintenanceConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getById.queryKey({ variantId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        for (const formulaMode of ["excel_bugfixed", "excel_replica"] as const) {
          queryClient.invalidateQueries({
            queryKey: trpc.calculation.calculate.queryKey({
              variantId,
              formulaMode,
            }),
          });
        }
      },
    })
  );

  const form = useForm<MaintenanceValues>({
    resolver: zodResolver(maintenanceSchema),
    mode: "onBlur",
    defaultValues: {
      buildingElementMaintenancePercent: initialPercent * 100,
    },
  });

  const onSave = useCallback(
    async (values: MaintenanceValues) => {
      await upsertMC.mutateAsync({
        variantId,
        buildingElementMaintenancePercent:
          values.buildingElementMaintenancePercent / 100,
      });
    },
    [variantId, upsertMC]
  );

  useAutosave({ control: form.control, onSave });

  const pct = form.watch("buildingElementMaintenancePercent") ?? 0;
  const annualMaintEur = groupAConstructionTotal * (pct / 100);

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold">
            Building Elements Annual Maintenance (Group A)
          </h2>
          <p className="text-xs text-muted-foreground">
            Annual maintenance allowance for architectural and structural
            elements (A1–A10), expressed as a percentage of their initial
            construction cost (typically 1.0%–2.0%/year).
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2.5">
          <div>
            <div className="text-[11px] text-muted-foreground">
              Group A Construction
            </div>
            <div className="text-sm font-semibold tabular-nums">
              €{formatCurrency(groupAConstructionTotal)}
            </div>
          </div>
          <div className="h-7 w-px bg-border" />
          <div>
            <div className="text-[11px] text-muted-foreground">
              Annual Maintenance
            </div>
            <div className="text-sm font-bold text-primary tabular-nums">
              €{formatCurrency(annualMaintEur)}/yr
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 max-w-md">
        <SliderInput
          name="buildingElementMaintenancePercent"
          control={form.control}
          label="Annual Maintenance Rate (%)"
          min={0}
          max={10}
          step={0.1}
          unit="%"
          tooltip="Percentage of Group A construction cost spent annually on preventive and routine maintenance."
        />
      </div>
    </GlassCard>
  );
}

// -- Service Components Section (EN 15459) --

function ServiceComponentsSection({
  serviceComponents,
  onServiceComponentUpdate,
  onServiceComponentDelete,
  onServiceComponentAdd,
}: {
  serviceComponents: ServiceComponent[];
  onServiceComponentUpdate: (
    componentId: string,
    field: string,
    value: number | string
  ) => void;
  onServiceComponentDelete: (componentId: string) => void;
  onServiceComponentAdd: () => void;
}) {
  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold">
              Building Services & RES Maintenance / Replacements (EN 15459)
            </h2>
            <InfoTooltip content="Each component uses standard EN 15459:2018 lifespan and annual maintenance % values to compute periodic replacement costs and residual value." />
          </div>
          <p className="text-xs text-muted-foreground">
            List technical systems (heat pumps, boilers, ventilation, PV panels,
            inverters) to model their annual maintenance and periodic
            replacements over the reference period.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onServiceComponentAdd}
        >
          <Plus className="mr-1.5 size-3.5" />
          Add Component
        </Button>
      </div>

      {serviceComponents.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Component Label</TableHead>
                <TableHead className="w-[160px] text-right">
                  Initial Cost (€)
                </TableHead>
                <TableHead className="min-w-[320px]">
                  EN 15459 Reference Component (Lifespan & Maint. %)
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceComponents.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell>
                    <Input
                      defaultValue={comp.name}
                      placeholder="e.g. PV panels, Heat pump..."
                      className="h-8 text-sm"
                      onBlur={(e) =>
                        onServiceComponentUpdate(comp.id, "name", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <NumericFormat
                      value={comp.constructionCost}
                      onValueChange={(v) =>
                        onServiceComponentUpdate(
                          comp.id,
                          "constructionCost",
                          v.floatValue ?? 0
                        )
                      }
                      thousandSeparator=","
                      decimalScale={0}
                      customInput={Input}
                      className="h-8 text-right text-sm tabular-nums"
                    />
                  </TableCell>
                  <TableCell>
                    <EN15459Combobox
                      value={comp.en15459ComponentIndex}
                      onChange={(idx) =>
                        onServiceComponentUpdate(
                          comp.id,
                          "en15459ComponentIndex",
                          idx
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onServiceComponentDelete(comp.id)}
                      aria-label="Delete service component"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          No EN 15459 service components configured. Click{" "}
          <strong>Add Component</strong> to model HVAC/RES maintenance and
          replacement cycles.
        </div>
      )}
    </GlassCard>
  );
}

// -- WLC: Non-Construction Costs Section --

function NonConstructionSection({
  variant,
  variantId,
  projectId,
}: {
  variant: {
    wlcInput: Record<string, unknown> | null;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertWLC = useMutation(
    trpc.variant.upsertWLCInput.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getById.queryKey({ variantId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        for (const formulaMode of ["excel_bugfixed", "excel_replica"] as const) {
          queryClient.invalidateQueries({
            queryKey: trpc.calculation.calculate.queryKey({
              variantId,
              formulaMode,
            }),
          });
        }
      },
    })
  );
  const w = variant.wlcInput;
  const n = (key: string) => (w?.[key] as number | null | undefined) ?? null;
  const persistedMode =
    w?.landCostMode === "TOTAL_COST" ? "TOTAL_COST" : "UNIT_PRICE";
  const [showOptional, setShowOptional] = useState(
    Boolean(
      n("enablingCost1") ||
        n("enablingCost2") ||
        n("planningFees1") ||
        n("planningFees2") ||
        n("userSupportPropMgmt") ||
        n("userSupportCharges") ||
        n("userSupportAdmin") ||
        n("financeCost")
    )
  );

  const form = useForm<WLCInputValues>({
    resolver: zodResolver(wlcInputSchema),
    mode: "onBlur",
    defaultValues: {
      landCostMode: persistedMode,
      landArea: n("landArea"),
      buildingIndex: n("buildingIndex"),
      floorHeight: n("floorHeight"),
      landPrice: n("landPrice"),
      landCostTotal: n("landCostTotal"),
      enablingCost1: n("enablingCost1"),
      enablingCost2: n("enablingCost2"),
      planningFees1: n("planningFees1"),
      planningFees2: n("planningFees2"),
      userSupportPropMgmt: n("userSupportPropMgmt"),
      userSupportCharges: n("userSupportCharges"),
      userSupportAdmin: n("userSupportAdmin"),
      financeCost: n("financeCost"),
    },
  });

  const onSave = useCallback(
    async (values: WLCInputValues) => {
      await upsertWLC.mutateAsync({ variantId, ...values });
    },
    [variantId, upsertWLC]
  );

  useAutosave({ control: form.control, onSave });

  const landCostMode = form.watch("landCostMode");
  const landArea = form.watch("landArea") ?? 0;
  const landPrice = form.watch("landPrice") ?? 0;
  const landCostTotal = form.watch("landCostTotal") ?? 0;
  const computedUnitPriceTotal = landArea * landPrice;
  const activeLandTotal =
    landCostMode === "TOTAL_COST" ? landCostTotal : computedUnitPriceTotal;

  const setLandCostMode = (mode: WLCInputValues["landCostMode"]) => {
    if (mode === "TOTAL_COST" && !form.getValues("landCostTotal")) {
      form.setValue("landCostTotal", computedUnitPriceTotal, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    form.setValue("landCostMode", mode, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            WLC — Land & Non-Construction Costs
          </h2>
          <p className="text-xs text-muted-foreground">
            Process 1 costs under ISO 15686-5 (included in Whole-Life Cost WLC,
            excluded from Life-Cycle Cost LCC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
            {(["TOTAL_COST", "UNIT_PRICE"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLandCostMode(mode)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  landCostMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "TOTAL_COST" ? "Total Land Cost" : "Area × Unit Price"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOptional((v) => !v)}
          >
            {showOptional
              ? "Hide Enabling / Planning Fees"
              : "Add Enabling / Planning Fees"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {landCostMode === "TOTAL_COST" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <CurrencyInput
              name="landCostTotal"
              control={form.control}
              label="Total Land Cost (€)"
            />
            <NumberInput
              name="landArea"
              control={form.control}
              label="Plot / Land Area (Optional)"
              suffix={` ${UNITS.m2}`}
            />
            <NumberInput
              name="buildingIndex"
              control={form.control}
              label="Building Index (Optional)"
              decimalScale={3}
              suffix=" m³/m²"
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberInput
              name="landArea"
              control={form.control}
              label="Land Area"
              suffix={` ${UNITS.m2}`}
            />
            <CurrencyInput
              name="landPrice"
              control={form.control}
              label={`Land Unit Price (${UNITS.EUR_m2})`}
            />
            <NumberInput
              name="buildingIndex"
              control={form.control}
              label="Building Index"
              decimalScale={3}
            />
            <div className="flex flex-col justify-end rounded-lg border bg-muted/25 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Computed Land Cost
              </span>
              <span className="text-sm font-bold tabular-nums">
                €{formatCurrency(activeLandTotal)}
              </span>
            </div>
          </div>
        )}

        {showOptional && (
          <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <CurrencyInput
              name="enablingCost1"
              control={form.control}
              label="Enabling / Site Prep Cost 1"
            />
            <CurrencyInput
              name="enablingCost2"
              control={form.control}
              label="Enabling / Site Prep Cost 2"
            />
            <CurrencyInput
              name="planningFees1"
              control={form.control}
              label="Planning & Permit Fees 1"
            />
            <CurrencyInput
              name="planningFees2"
              control={form.control}
              label="Planning & Permit Fees 2"
            />
            <CurrencyInput
              name="userSupportPropMgmt"
              control={form.control}
              label="Property Management"
            />
            <CurrencyInput
              name="userSupportCharges"
              control={form.control}
              label="Support Charges"
            />
            <CurrencyInput
              name="userSupportAdmin"
              control={form.control}
              label="Administration Costs"
            />
            <CurrencyInput
              name="financeCost"
              control={form.control}
              label="Finance / Loan Costs"
            />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// -- WLC: Design & Site Management Costs Section --

function DesignCostsSection({
  variant,
  variantId,
  projectId,
}: {
  variant: {
    designCosts: Array<Record<string, unknown>>;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertDesignCosts = useMutation(
    trpc.variant.upsertDesignCosts.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getById.queryKey({ variantId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        for (const formulaMode of ["excel_bugfixed", "excel_replica"] as const) {
          queryClient.invalidateQueries({
            queryKey: trpc.calculation.calculate.queryKey({
              variantId,
              formulaMode,
            }),
          });
        }
      },
    })
  );

  const defaultCosts =
    variant.designCosts.length > 0
      ? variant.designCosts.map((dc) => ({
          lineNumber: (dc.lineNumber as number) ?? 1,
          description: (dc.description as string) ?? "",
          preliminaryCost: (dc.preliminaryCost as number) ?? 0,
          definitiveCost: (dc.definitiveCost as number) ?? 0,
          executiveCost: (dc.executiveCost as number) ?? 0,
          siteManagementCost: (dc.siteManagementCost as number) ?? 0,
        }))
      : [
          {
            lineNumber: 1,
            description: "Architectural & Engineering Design",
            preliminaryCost: 0,
            definitiveCost: 0,
            executiveCost: 0,
            siteManagementCost: 0,
          },
        ];

  const form = useForm<DesignCostsValues>({
    resolver: zodResolver(designCostsSchema),
    mode: "onBlur",
    defaultValues: { costs: defaultCosts },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costs",
  });

  const onSave = useCallback(
    async (values: DesignCostsValues) => {
      await upsertDesignCosts.mutateAsync({
        variantId,
        costs: values.costs,
      });
    },
    [variantId, upsertDesignCosts]
  );

  useAutosave({ control: form.control, onSave });

  const watchedCosts = form.watch("costs") ?? [];
  const totals = useMemo(() => {
    return watchedCosts.reduce(
      (acc, row) => {
        const design =
          (row.preliminaryCost ?? 0) +
          (row.definitiveCost ?? 0) +
          (row.executiveCost ?? 0);
        const site = row.siteManagementCost ?? 0;
        return {
          design: acc.design + design,
          site: acc.site + site,
        };
      },
      { design: 0, site: 0 }
    );
  }, [watchedCosts]);

  const addRow = () => {
    const nextLine =
      fields.length > 0
        ? Math.max(
            ...fields.map((_, i) => form.getValues(`costs.${i}.lineNumber`))
          ) + 1
        : 1;
    append({
      lineNumber: nextLine,
      description: "",
      preliminaryCost: 0,
      definitiveCost: 0,
      executiveCost: 0,
      siteManagementCost: 0,
    });
  };

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            WLC — Building Design & Site Management Costs
          </h2>
          <p className="text-xs text-muted-foreground">
            Professional fees (Preliminary, Definitive, Executive design) and
            building site management costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Design Total:{" "}
            <strong className="text-foreground tabular-nums">
              €{formatCurrency(totals.design)}
            </strong>{" "}
            · Site Mgmt:{" "}
            <strong className="text-foreground tabular-nums">
              €{formatCurrency(totals.site)}
            </strong>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 size-3.5" />
            Add Fee Line
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="min-w-[180px]">
                Professional / Activity Description
              </TableHead>
              <TableHead className="w-[140px] text-right">
                Preliminary (€)
              </TableHead>
              <TableHead className="w-[140px] text-right">
                Definitive (€)
              </TableHead>
              <TableHead className="w-[140px] text-right">
                Executive (€)
              </TableHead>
              <TableHead className="w-[140px] text-right">
                Site Mgmt (€)
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, i) => (
              <TableRow key={field.id}>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {form.watch(`costs.${i}.lineNumber`)}
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`costs.${i}.description`)}
                    className="h-8 text-sm"
                    placeholder="e.g. Architects, Energy design..."
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.preliminaryCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={0}
                        customInput={Input}
                        className="h-8 text-right text-sm tabular-nums"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.definitiveCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={0}
                        customInput={Input}
                        className="h-8 text-right text-sm tabular-nums"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.executiveCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={0}
                        customInput={Input}
                        className="h-8 text-right text-sm tabular-nums"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.siteManagementCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={0}
                        customInput={Input}
                        className="h-8 text-right text-sm tabular-nums"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

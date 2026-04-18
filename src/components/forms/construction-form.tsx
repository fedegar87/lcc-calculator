"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useSaveStatus } from "@/hooks/use-save-status";
import { useAutosave } from "@/hooks/use-autosave";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlassCard } from "@/components/shared/glass-card";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { SliderInput } from "@/components/shared/slider-input";
import { EN15459Combobox } from "@/components/forms/shared/en15459-combobox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

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
}

interface CategoryDef {
  value: string;
  label: string;
  group: string;
}

// -- Maintenance Config Schema --

const maintenanceSchema = z.object({
  buildingElementMaintenancePercent: z.number().min(0).max(100),
});

type MaintenanceValues = z.infer<typeof maintenanceSchema>;

function formatCurrency(val: number): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// -- Detail Row --

interface DetailRowProps {
  detail: CostItemDetail;
  onUpdate: (field: string, value: number | string) => void;
  onDelete: () => void;
}

function DetailRow({ detail, onUpdate, onDelete }: DetailRowProps) {
  const isMobile = useIsMobile();
  const resolvedCost = Math.max(
    detail.materialCost,
    detail.unitPrice * detail.area
  );

  if (isMobile) {
    return (
      <div className="space-y-3 rounded-xl border bg-muted/15 p-4">
        <Input
          defaultValue={detail.description ?? ""}
          placeholder="Description"
          className="h-9 text-sm"
          onBlur={(e) => onUpdate("description", e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumericFormat
            value={detail.area}
            onValueChange={(v) => onUpdate("area", v.floatValue ?? 0)}
            decimalScale={2}
            placeholder="Area (m2)"
            customInput={Input}
            className="h-9 text-sm"
          />
          <NumericFormat
            value={detail.unitPrice}
            onValueChange={(v) => onUpdate("unitPrice", v.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            placeholder="Unit price"
            customInput={Input}
            className="h-9 text-sm"
          />
          <NumericFormat
            value={detail.materialCost}
            onValueChange={(v) => onUpdate("materialCost", v.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            placeholder="Material"
            customInput={Input}
            className="h-9 text-sm"
          />
          <NumericFormat
            value={detail.laborCost}
            onValueChange={(v) => onUpdate("laborCost", v.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            placeholder="Labor"
            customInput={Input}
            className="h-9 text-sm"
          />
          <NumericFormat
            value={detail.otherCost}
            onValueChange={(v) => onUpdate("otherCost", v.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            placeholder="Other"
            customInput={Input}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Resolved = max(material, unit price x area)
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(resolvedCost)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_80px_100px_100px_100px_100px_80px_32px] items-center gap-2 py-1.5">
      <Input
        defaultValue={detail.description ?? ""}
        placeholder="Description"
        className="h-8 text-sm"
        onBlur={(e) => onUpdate("description", e.target.value)}
      />
      <NumericFormat
        value={detail.area}
        onValueChange={(v) => onUpdate("area", v.floatValue ?? 0)}
        decimalScale={2}
        placeholder="m2"
        customInput={Input}
        className="h-8 text-sm"
      />
      <NumericFormat
        value={detail.materialCost}
        onValueChange={(v) => onUpdate("materialCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        customInput={Input}
        className="h-8 text-sm"
      />
      <NumericFormat
        value={detail.unitPrice}
        onValueChange={(v) => onUpdate("unitPrice", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        customInput={Input}
        className="h-8 text-sm"
      />
      <NumericFormat
        value={detail.laborCost}
        onValueChange={(v) => onUpdate("laborCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        customInput={Input}
        className="h-8 text-sm"
      />
      <NumericFormat
        value={detail.otherCost}
        onValueChange={(v) => onUpdate("otherCost", v.floatValue ?? 0)}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        customInput={Input}
        className="h-8 text-sm"
      />
      <span className="text-right text-xs text-muted-foreground tabular-nums">
        {formatCurrency(resolvedCost)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// -- Service Component Row --

interface ServiceComponentRowProps {
  component: ServiceComponent;
  onUpdate: (field: string, value: number | string) => void;
  onDelete: () => void;
}

function ServiceComponentRow({
  component,
  onUpdate,
  onDelete,
}: ServiceComponentRowProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            defaultValue={component.name}
            placeholder="Component name"
            className="h-9 text-sm"
            onBlur={(e) => onUpdate("name", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Construction cost</Label>
          <NumericFormat
            value={component.constructionCost}
            onValueChange={(v) =>
              onUpdate("constructionCost", v.floatValue ?? 0)
            }
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
            customInput={Input}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">EN 15459 component</Label>
          <EN15459Combobox
            value={component.en15459ComponentIndex}
            onChange={(idx) => onUpdate("en15459ComponentIndex", idx)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_140px_1fr_32px] items-start gap-3 rounded-md border border-dashed p-3">
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input
          defaultValue={component.name}
          placeholder="Component name"
          className="h-8 text-sm"
          onBlur={(e) => onUpdate("name", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Cost</Label>
        <NumericFormat
          value={component.constructionCost}
          onValueChange={(v) =>
            onUpdate("constructionCost", v.floatValue ?? 0)
          }
          thousandSeparator=","
          decimalScale={2}
          fixedDecimalScale
          customInput={Input}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">EN 15459 Component</Label>
        <EN15459Combobox
          value={component.en15459ComponentIndex}
          onChange={(idx) => onUpdate("en15459ComponentIndex", idx)}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-6 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// -- Category Accordion Item --

interface CategoryItemProps {
  category: CategoryDef;
  costItem: CostItem | undefined;
  onDetailUpdate: (
    costItemId: string,
    detailId: string,
    field: string,
    value: number | string
  ) => void;
  onDetailDelete: (costItemId: string, detailId: string) => void;
  onDetailAdd: (category: string) => void;
}

function CategoryItem({
  category,
  costItem,
  onDetailUpdate,
  onDetailDelete,
  onDetailAdd,
}: CategoryItemProps) {
  const isMobile = useIsMobile();
  const total = costItem
    ? costItem.materialCostAgg + costItem.laborCostAgg + costItem.otherCostAgg
    : 0;

  return (
    <AccordionItem value={category.value}>
      <AccordionTrigger className="px-2">
        <div className="flex flex-1 items-center gap-3">
          <span>{category.label}</span>
          {total > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
              {formatCurrency(total)}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2">
        {/* Detail row headers */}
        {!isMobile && (costItem?.details?.length ?? 0) > 0 && (
          <div className="grid grid-cols-[1fr_80px_100px_100px_100px_100px_80px_32px] gap-2 border-b pb-1 text-xs font-medium text-muted-foreground">
            <span>Description</span>
            <span>Area (m2)</span>
            <span>Material</span>
            <span>Unit Price</span>
            <span>Labor</span>
            <span>Other</span>
            <span className="text-right">Resolved</span>
            <span />
          </div>
        )}

        {/* Detail rows */}
        {costItem?.details?.map((detail) => (
          <DetailRow
            key={detail.id}
            detail={detail}
            onUpdate={(field, value) =>
              onDetailUpdate(costItem.id, detail.id, field, value)
            }
            onDelete={() => onDetailDelete(costItem.id, detail.id)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => onDetailAdd(category.value)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Detail
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

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
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">
              Service components and replacements
            </h2>
            <InfoTooltip content="These EN 15459 components are variant-level maintenance and replacement drivers. Add them once per variant, not once per construction category." />
          </div>
          <p className="text-sm text-muted-foreground">
            Use this list for plant and renewable systems with lifespans and
            maintenance percentages from EN 15459.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onServiceComponentAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Service Component
        </Button>
      </div>

      {serviceComponents.length > 0 ? (
        <div className="space-y-3">
          {serviceComponents.map((component) => (
            <ServiceComponentRow
              key={component.id}
              component={component}
              onUpdate={(field, value) =>
                onServiceComponentUpdate(component.id, field, value)
              }
              onDelete={() => onServiceComponentDelete(component.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          No EN 15459 service components yet. Add boilers, chillers, PV systems,
          ventilation units, or other replaceable services here so the results
          include replacement cycles and maintenance.
        </div>
      )}
    </GlassCard>
  );
}

// -- Main Construction Form --

interface ConstructionFormProps {
  variantId: string;
}

export function ConstructionForm({ variantId }: ConstructionFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();

  // Debounce timer for detail updates
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const pendingUpdates = useRef<
    Record<string, Record<string, number | string>>
  >({});

  // Fetch reference data
  const { data: categories = [] } = useQuery(
    trpc.reference.costCategories.queryOptions()
  );

  // Fetch variant data for service components
  const { data: variant } = useQuery(
    trpc.variant.getById.queryOptions({ variantId })
  );

  // Fetch cost items
  const {
    data: costItems = [],
    isPending: costItemsPending,
  } = useQuery(trpc.costItem.listByVariant.queryOptions({ variantId }));

  const serviceComponents = useMemo(
    () => variant?.serviceComponents ?? [],
    [variant?.serviceComponents]
  );

  // -- Mutations --

  const upsertCostItem = useMutation(
    trpc.costItem.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
      },
    })
  );

  const upsertDetail = useMutation(
    trpc.costItem.upsertDetail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
        setStatus("saved");
      },
      onError: () => {
        setStatus("failed");
        toast.error("Failed to save detail");
      },
    })
  );

  const deleteDetail = useMutation(
    trpc.costItem.deleteDetail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.costItem.listByVariant.queryKey({ variantId }),
        });
        setStatus("saved");
      },
      onError: () => {
        toast.error("Failed to delete detail");
      },
    })
  );

  const upsertServiceComponent = useMutation(
    trpc.variant.upsertServiceComponent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getById.queryKey({ variantId }),
        });
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
        queryClient.invalidateQueries({
          queryKey: trpc.variant.getById.queryKey({ variantId }),
        });
        setStatus("saved");
      },
      onError: () => {
        toast.error("Failed to delete service component");
      },
    })
  );

  // -- Handlers --

  // Debounced detail update: batch field changes per detail, flush after 500ms
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
      }, 500);
    },
    [setStatus, upsertDetail]
  );

  const handleDetailDelete = useCallback(
    (costItemId: string, detailId: string) => {
      // Cancel pending debounced updates for this detail
      clearTimeout(debounceTimers.current[detailId]);
      delete pendingUpdates.current[detailId];
      deleteDetail.mutate({ detailId });
    },
    [deleteDetail]
  );

  const handleDetailAdd = useCallback(
    async (category: string) => {
      // Ensure cost item exists for this category
      const existing = costItems.find((ci) => ci.category === category);
      let costItemId: string;
      let maxOrder = 0;

      if (existing) {
        costItemId = existing.id;
        maxOrder = existing.details
          ? Math.max(0, ...existing.details.map((d) => d.layerOrder))
          : 0;
      } else {
        const created = await upsertCostItem.mutateAsync({
          variantId,
          category: category as Parameters<
            typeof upsertCostItem.mutateAsync
          >[0]["category"],
        });
        costItemId = created.id;
      }

      upsertDetail.mutate({
        costItemId,
        layerOrder: maxOrder + 1,
        description: "",
      });
    },
    [costItems, variantId, upsertCostItem, upsertDetail]
  );

  // Service component handlers -- discrete actions, no debounce
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
          field === "constructionCost" ? Number(value) : existing.constructionCost,
        en15459ComponentIndex:
          field === "en15459ComponentIndex"
            ? Number(value)
            : existing.en15459ComponentIndex,
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

  const handleServiceComponentAdd = useCallback(
    () => {
      upsertServiceComponent.mutate({
        variantId,
        name: "New component",
        constructionCost: 0,
        en15459ComponentIndex: 1,
      });
    },
    [variantId, upsertServiceComponent]
  );

  // Cleanup debounce timers
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // -- Grouping --

  const groups = categories.reduce<Record<string, CategoryDef[]>>(
    (acc, cat) => {
      const group = cat.group;
      if (!acc[group]) acc[group] = [];
      acc[group].push(cat as CategoryDef);
      return acc;
    },
    {}
  );

  const GROUP_ORDER = [
    "Building Elements",
    "Building Services",
    "Renewable Energy",
    "Furnishings",
    "Outdoor",
  ];
  const pricedCategoryCount = costItems.filter((costItem) => {
    const detailTotal =
      (costItem.details ?? []).reduce((sum, detail) => {
        return (
          sum +
          Math.max(detail.materialCost, detail.unitPrice * detail.area) +
          detail.laborCost +
          detail.otherCost
        );
      }, 0) ?? 0;

    return detailTotal > 0;
  }).length;
  const detailCount = costItems.reduce(
    (sum, costItem) => sum + (costItem.details?.length ?? 0),
    0
  );

  if (costItemsPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h2 className="text-lg font-semibold">Construction cost detail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Work category by category. Add one or more detail rows where you
              need an auditable trail, and keep EN 15459 replacement components
              in the dedicated section below.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Priced categories
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {pricedCategoryCount}/{categories.length}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Detail rows
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {detailCount}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  EN 15459 components
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {serviceComponents.length}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/25 p-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Cost resolution rule</h3>
              <InfoTooltip content="The engine uses the larger of material cost or unit price multiplied by area, then adds labor and other costs. This note makes the rule visible while you edit." />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Resolved cost = `max(material, unit price x area) + labor + other`
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If you only know a lump-sum material value, enter that. If you
              know area and unit price, the resolved check will flag the higher
              value automatically.
            </p>
          </div>
        </div>
      </GlassCard>

      {GROUP_ORDER.map((groupName) => {
        const groupCategories = groups[groupName];
        if (!groupCategories?.length) return null;

        return (
          <GlassCard key={groupName}>
            <h3 className="mb-3 text-base font-semibold">{groupName}</h3>
            <Accordion multiple>
              {groupCategories.map((cat) => {
                const costItem = costItems.find(
                  (ci) => ci.category === cat.value
                );

                return (
                  <CategoryItem
                    key={cat.value}
                    category={cat}
                    costItem={costItem}
                    onDetailUpdate={handleDetailUpdate}
                    onDetailDelete={handleDetailDelete}
                    onDetailAdd={handleDetailAdd}
                  />
                );
              })}
            </Accordion>
          </GlassCard>
        );
      })}
      <ServiceComponentsSection
        serviceComponents={serviceComponents}
        onServiceComponentUpdate={handleServiceComponentUpdate}
        onServiceComponentDelete={handleServiceComponentDelete}
        onServiceComponentAdd={handleServiceComponentAdd}
      />
      {variant && (
        <MaintenanceConfigSection variant={variant} variantId={variantId} />
      )}
    </div>
  );
}

// -- Maintenance Config Section --

function MaintenanceConfigSection({
  variant,
  variantId,
}: {
  variant: {
    maintenanceConfig: {
      buildingElementMaintenancePercent: number;
    } | null;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertMaintenance = useMutation(
    trpc.variant.upsertMaintenanceConfig.mutationOptions()
  );

  const mc = variant.maintenanceConfig;

  const form = useForm<MaintenanceValues>({
    resolver: zodResolver(maintenanceSchema),
    mode: "onBlur",
    defaultValues: {
      // Display as percentage (0-100), store as decimal (0-1)
      buildingElementMaintenancePercent:
        (mc?.buildingElementMaintenancePercent ?? 0.02) * 100,
    },
  });

  const onSave = useCallback(
    async (values: MaintenanceValues) => {
      await upsertMaintenance.mutateAsync({
        variantId,
        buildingElementMaintenancePercent:
          values.buildingElementMaintenancePercent / 100,
      });
    },
    [variantId, upsertMaintenance]
  );

  useAutosave({ control: form.control, onSave });

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Maintenance Configuration</h2>
        <InfoTooltip content="Annual maintenance cost as percentage of construction cost for building elements" />
      </div>
      <div className="max-w-lg">
        <SliderInput
          name="buildingElementMaintenancePercent"
          control={form.control}
          label="Building Element Maintenance"
          min={0}
          max={10}
          step={0.1}
          unit="%"
          tooltip="Percentage of construction cost allocated annually for building element maintenance"
        />
      </div>
    </GlassCard>
  );
}

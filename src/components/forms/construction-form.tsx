"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useSaveStatus } from "@/hooks/use-save-status";
import { GlassCard } from "@/components/shared/glass-card";
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

// Categories that support service components (B and C groups)
const SERVICE_COMPONENT_GROUPS = new Set(["Building Services", "Renewable Energy"]);

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
  const resolvedCost = Math.max(
    detail.materialCost,
    detail.unitPrice * detail.area
  );

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
  serviceComponents: ServiceComponent[];
  showServiceComponents: boolean;
  variantId: string;
  onDetailUpdate: (
    costItemId: string,
    detailId: string,
    field: string,
    value: number | string
  ) => void;
  onDetailDelete: (costItemId: string, detailId: string) => void;
  onDetailAdd: (category: string) => void;
  onServiceComponentUpdate: (
    componentId: string,
    field: string,
    value: number | string
  ) => void;
  onServiceComponentDelete: (componentId: string) => void;
  onServiceComponentAdd: (category: string) => void;
}

function CategoryItem({
  category,
  costItem,
  serviceComponents,
  showServiceComponents,
  onDetailUpdate,
  onDetailDelete,
  onDetailAdd,
  onServiceComponentUpdate,
  onServiceComponentDelete,
  onServiceComponentAdd,
}: CategoryItemProps) {
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
        {(costItem?.details?.length ?? 0) > 0 && (
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

        {/* Service components for B/C categories */}
        {showServiceComponents && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Service Components
            </h4>
            {serviceComponents.map((sc) => (
              <ServiceComponentRow
                key={sc.id}
                component={sc}
                onUpdate={(field, value) =>
                  onServiceComponentUpdate(sc.id, field, value)
                }
                onDelete={() => onServiceComponentDelete(sc.id)}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onServiceComponentAdd(category.value)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Service Component
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
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
    (_category: string) => {
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
                const catServiceComponents = serviceComponents.filter(
                  (_sc) => true // service components are variant-level
                );
                const showSC = SERVICE_COMPONENT_GROUPS.has(groupName);

                return (
                  <CategoryItem
                    key={cat.value}
                    category={cat}
                    costItem={costItem}
                    serviceComponents={
                      showSC ? catServiceComponents : []
                    }
                    showServiceComponents={showSC}
                    variantId={variantId}
                    onDetailUpdate={handleDetailUpdate}
                    onDetailDelete={handleDetailDelete}
                    onDetailAdd={handleDetailAdd}
                    onServiceComponentUpdate={
                      handleServiceComponentUpdate
                    }
                    onServiceComponentDelete={
                      handleServiceComponentDelete
                    }
                    onServiceComponentAdd={handleServiceComponentAdd}
                  />
                );
              })}
            </Accordion>
          </GlassCard>
        );
      })}
    </div>
  );
}

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface Variant {
  id: string;
  label: string;
}

interface VariantTabsProps {
  projectId: string;
  variants: Variant[];
  activeVariantId: string;
  onVariantChange: (variantId: string) => void;
}

const LABEL_DISPLAY: Record<string, string> = {
  BASE: "Base",
  VARIANT_1: "Variant 1",
  VARIANT_2: "Variant 2",
};

function humanLabel(label: string): string {
  return LABEL_DISPLAY[label] ?? label;
}

function getNextVariantLabel(
  variants: Variant[]
): "VARIANT_1" | "VARIANT_2" | null {
  const labels = new Set(variants.map((v) => v.label));
  if (!labels.has("VARIANT_1")) return "VARIANT_1";
  if (!labels.has("VARIANT_2")) return "VARIANT_2";
  return null;
}

export function VariantTabs({
  projectId,
  variants,
  activeVariantId,
  onVariantChange,
}: VariantTabsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const addVariant = useMutation(
    trpc.project.addVariant.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${humanLabel(data.label)} created`);
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        onVariantChange(data.id);
      },
      onError: (err) => {
        toast.error(err.message);
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
      },
    })
  );

  const nextLabel = getNextVariantLabel(variants);
  const canAdd = nextLabel !== null;

  return (
    <Tabs value={activeVariantId} onValueChange={onVariantChange}>
      <TabsList>
        {variants.map((v) => (
          <TabsTrigger key={v.id} value={v.id}>
            {humanLabel(v.label)}
          </TabsTrigger>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() =>
              addVariant.mutate({ projectId, label: nextLabel })
            }
            disabled={addVariant.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {addVariant.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </button>
        )}
      </TabsList>
    </Tabs>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { toast } from "sonner";
import { Plus, Loader2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  label: string;
  description?: string | null;
}

interface VariantTabsProps {
  projectId: string;
  variants: Variant[];
  activeVariantId: string;
  onVariantChange: (variantId: string) => void;
}

const LABEL_DISPLAY: Record<string, string> = {
  BASE: "Base Case",
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<
    "clone_base" | "clone_current" | "empty"
  >("clone_base");
  const [description, setDescription] = useState("");

  const addVariant = useMutation(
    trpc.project.addVariant.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${humanLabel(data.label)} created`);
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        setDialogOpen(false);
        setDescription("");
        onVariantChange(data.id);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );
  const cloneVariant = useMutation(
    trpc.project.cloneVariant.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${humanLabel(data.label)} cloned from existing data`);
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
        setDialogOpen(false);
        setDescription("");
        setCreationMode("clone_base");
        onVariantChange(data.id);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const nextLabel = getNextVariantLabel(variants);
  const canAdd = nextLabel !== null;
  const isPending = addVariant.isPending || cloneVariant.isPending;
  const baseVariantId = variants.find((variant) => variant.label === "BASE")?.id;

  const cloneSourceId = useMemo(() => {
    if (creationMode === "clone_current") {
      return activeVariantId;
    }
    return baseVariantId ?? activeVariantId;
  }, [activeVariantId, baseVariantId, creationMode]);

  function handleCreateVariant() {
    if (!nextLabel) return;

    const trimmedDescription = description.trim() || undefined;
    if (creationMode === "empty") {
      addVariant.mutate({
        projectId,
        label: nextLabel,
        description: trimmedDescription,
      });
      return;
    }

    if (!cloneSourceId) {
      toast.error("No source variant is available to clone.");
      return;
    }

    cloneVariant.mutate({
      projectId,
      label: nextLabel,
      sourceVariantId: cloneSourceId,
      description: trimmedDescription,
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:inline-flex">
          <Layers className="size-3.5" />
          Scenario:
        </span>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1">
          {variants.map((v) => {
            const isActive = v.id === activeVariantId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onVariantChange(v.id)}
                title={v.description || humanLabel(v.label)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{humanLabel(v.label)}</span>
                {v.description && (
                  <span className="hidden max-w-[9rem] truncate text-[11px] font-normal text-muted-foreground lg:inline">
                    ({v.description})
                  </span>
                )}
              </button>
            );
          })}
          {canAdd && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              title="Add comparison variant (up to 2 variants)"
            >
              <Plus className="size-3.5" />
              <span>Add Variant</span>
            </button>
          )}
        </div>
      </div>

      {canAdd ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add {humanLabel(nextLabel!)}</DialogTitle>
              <DialogDescription>
                Clone the Base Case to test an alternative design or energy system without re-entering all inputs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Starting data</Label>
                <Select
                  value={creationMode}
                  onValueChange={(value) => {
                    if (value) setCreationMode(value as typeof creationMode);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {baseVariantId ? (
                      <SelectItem value="clone_base">
                        Copy from Base Case (recommended)
                      </SelectItem>
                    ) : null}
                    <SelectItem value="clone_current">
                      Copy from active scenario
                    </SelectItem>
                    <SelectItem value="empty">Start blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-description">Short label / note (optional)</Label>
                <Input
                  id="variant-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="e.g., Heat pump + 120 kWp PV"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVariant} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Variant"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

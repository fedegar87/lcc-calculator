"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { ReadinessPill } from "@/components/project/readiness-pill";
import type { ProjectReadiness } from "@/lib/project-readiness";
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

interface Variant {
  id: string;
  label: string;
  description?: string | null;
  readiness?: ProjectReadiness | null;
  diffCount?: number;
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
  const cloneVariant = useMutation(
    trpc.project.cloneVariant.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${humanLabel(data.label)} created from existing data`);
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
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
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
    <div className="flex flex-wrap items-center gap-3">
      <Tabs value={activeVariantId} onValueChange={onVariantChange} className="min-w-0 flex-1">
        <TabsList className="h-auto flex-wrap items-stretch justify-start gap-2 bg-transparent p-0">
          {variants.map((v) => (
            <TabsTrigger
              key={v.id}
              value={v.id}
              className="min-w-[12rem] rounded-xl border bg-card px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                  <div className="truncate text-sm font-medium">
                    {humanLabel(v.label)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {v.diffCount
                      ? `${v.diffCount} changed input groups`
                      : v.label === "BASE"
                        ? "Reference variant"
                        : "No delta yet"}
                  </div>
                  {v.description ? (
                    <div className="mt-1 truncate text-[11px] text-muted-foreground/80">
                      {v.description}
                    </div>
                  ) : null}
                </div>
                {v.readiness ? (
                  <ReadinessPill status={v.readiness.status} className="shrink-0" />
                ) : null}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {canAdd ? (
        <>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New variant
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create {humanLabel(nextLabel!)}</DialogTitle>
                <DialogDescription>
                  Start from Base, clone the current variant, or create an empty shell.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Creation mode</Label>
                  <Select
                    value={creationMode}
                    onValueChange={(value) =>
                      setCreationMode(value as typeof creationMode)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {baseVariantId ? (
                        <SelectItem value="clone_base">Clone Base</SelectItem>
                      ) : null}
                      <SelectItem value="clone_current">
                        Clone current variant
                      </SelectItem>
                      <SelectItem value="empty">Empty variant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variant-description">Variant note</Label>
                  <Input
                    id="variant-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Facade upgrade, lower O&M scenario..."
                  />
                </div>

                <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {creationMode === "empty"
                    ? "The new variant will start with empty inputs and default records only."
                    : creationMode === "clone_current"
                      ? "The new variant will copy all current inputs, including construction, energy, WLC, and income data."
                      : "The new variant will copy the Base inputs so you can edit only the differences."}
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
                    "Create variant"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}

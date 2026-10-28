"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
import { NumberInput } from "@/components/forms/shared/number-input";
import { PercentInput } from "@/components/forms/shared/percent-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { UNIT_LABELS, UNITS } from "@/lib/units";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const BUILDING_USE_OPTIONS = [
  { value: "RESIDENTIAL_SINGLE", label: "Residential (Single-family)" },
  { value: "RESIDENTIAL_MULTI", label: "Residential (Multi-family / Terraced)" },
  { value: "OFFICE", label: "Office" },
  { value: "EDUCATION", label: "Education" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "OTHER", label: "Other" },
] as const;

const BUILDING_USE_ENUM = [
  "RESIDENTIAL_SINGLE",
  "RESIDENTIAL_MULTI",
  "OFFICE",
  "EDUCATION",
  "COMMERCIAL",
  "INDUSTRIAL",
  "OTHER",
] as const;

// -- Schemas --

const metadataSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  author: z.string().optional(),
  buildingUse: z.enum(BUILDING_USE_ENUM),
  constructionYear: z.string().optional(),
});

type MetadataValues = z.infer<typeof metadataSchema>;

const geometrySchema = z.object({
  grossFloorArea: z.number().nullable().optional(),
  netFloorArea: z.number().nullable().optional(),
  treatedFloorArea: z.number().nullable().optional(),
  windowArea: z.number().nullable().optional(),
  balconiesArea: z.number().nullable().optional(),
  otherSurfacesArea: z.number().nullable().optional(),
  unheatedGFA: z.number().nullable().optional(),
  unheatedNFA: z.number().nullable().optional(),
  grossVolume: z.number().nullable().optional(),
  netVolume: z.number().nullable().optional(),
  unheatedGrossVol: z.number().nullable().optional(),
  unheatedNetVol: z.number().nullable().optional(),
  totalThermalEnvelope: z.number().nullable().optional(),
  avgUvalueOpaque: z.number().nullable().optional(),
  avgUvalueGlazing: z.number().nullable().optional(),
  avgHeatRecovery: z.number().nullable().optional(),
  airTightness: z.number().nullable().optional(),
  pvInstalledCapacity: z.number().nullable().optional(),
  manualDesignConstructionCost: z.number().nullable().optional(),
});

type GeometryValues = z.infer<typeof geometrySchema>;

const incomeSchema = z.object({
  rent1MonthlyPerM2: z.number().nullable().optional(),
  rent1Area: z.number().nullable().optional(),
  rent1Taxes: z.number().nullable().optional(),
  rent2MonthlyPerM2: z.number().nullable().optional(),
  rent2Area: z.number().nullable().optional(),
  rent2Taxes: z.number().nullable().optional(),
  rent3MonthlyPerM2: z.number().nullable().optional(),
  rent3Area: z.number().nullable().optional(),
  rent3Taxes: z.number().nullable().optional(),
  otherIncome1: z.number().nullable().optional(),
  otherIncome1Taxes: z.number().nullable().optional(),
  otherIncome2: z.number().nullable().optional(),
  otherIncome2Taxes: z.number().nullable().optional(),
  otherIncome3: z.number().nullable().optional(),
  otherIncome3Taxes: z.number().nullable().optional(),
  expectedPricePerM2: z.number().nullable().optional(),
});

type IncomeValues = z.infer<typeof incomeSchema>;

interface InfoFormProps {
  projectId: string;
  variantId: string;
}

export function InfoForm({ projectId, variantId }: InfoFormProps) {
  const trpc = useTRPC();

  const { data: project, isPending: projectPending } = useQuery(
    trpc.project.getById.queryOptions({ projectId })
  );

  const { data: variant, isPending: variantPending } = useQuery(
    trpc.variant.getById.queryOptions({ variantId })
  );

  if (projectPending || variantPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project || !variant) return null;

  return (
    <div className="space-y-6">
      <MetadataSection project={project} projectId={projectId} />
      <GeometrySection
        variant={variant}
        variantId={variantId}
        projectId={projectId}
      />
      <IncomeSection
        variant={variant}
        variantId={variantId}
        projectId={projectId}
      />

      <div className="flex items-center justify-end pt-2">
        <Button
          render={
            <Link
              href={`/projects/${projectId}/energy?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          Next: 2. Energy & Economy
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  );
}

// -- Metadata Section --

function MetadataSection({
  project,
  projectId,
}: {
  project: {
    name: string;
    country: string | null;
    region: string | null;
    city: string | null;
    location: string | null;
    author: string | null;
    buildingUse: string;
    constructionYear: number | null;
  };
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateProject = useMutation(
    trpc.project.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.project.getById.queryKey({ projectId }),
        });
      },
    })
  );

  const form = useForm<MetadataValues>({
    resolver: zodResolver(metadataSchema),
    mode: "onBlur",
    defaultValues: {
      name: project.name,
      country: project.country ?? "",
      region: project.region ?? "",
      city: project.city ?? "",
      location: project.location ?? "",
      author: project.author ?? "",
      buildingUse:
        (project.buildingUse as MetadataValues["buildingUse"]) ??
        "RESIDENTIAL_MULTI",
      constructionYear: project.constructionYear?.toString() ?? "",
    },
  });

  const onSave = useCallback(
    async (values: MetadataValues) => {
      const year = values.constructionYear
        ? parseInt(values.constructionYear, 10)
        : undefined;
      await updateProject.mutateAsync({
        projectId,
        ...values,
        constructionYear: Number.isNaN(year) ? undefined : year,
      });
    },
    [projectId, updateProject]
  );

  useAutosave({ control: form.control, onSave });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Project Data</h2>
          <p className="text-xs text-muted-foreground">
            General identification and building typology (Project Information — Part I).
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="name">Project Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label>Building Use / Typology *</Label>
          </div>
          <Controller
            name="buildingUse"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_USE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="constructionYear">Construction Year</Label>
          <Input
            id="constructionYear"
            type="number"
            placeholder="e.g. 2015"
            {...register("constructionYear")}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" placeholder="e.g. Sweden" {...register("country")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="e.g. Växjö" {...register("city")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="author">Author / Compiler</Label>
          <Input id="author" placeholder="Optional" {...register("author")} />
        </div>
      </div>
    </GlassCard>
  );
}

// -- Geometry Section --

function GeometrySection({
  variant,
  variantId,
  projectId,
}: {
  variant: {
    geometry: {
      grossFloorArea: number | null;
      netFloorArea: number | null;
      treatedFloorArea: number | null;
      windowArea: number | null;
      balconiesArea: number | null;
      otherSurfacesArea: number | null;
      unheatedGFA: number | null;
      unheatedNFA: number | null;
      grossVolume: number | null;
      netVolume: number | null;
      unheatedGrossVol: number | null;
      unheatedNetVol: number | null;
      totalThermalEnvelope: number | null;
      avgUvalueOpaque: number | null;
      avgUvalueGlazing: number | null;
      avgHeatRecovery: number | null;
      airTightness: number | null;
      pvInstalledCapacity: number | null;
      manualDesignConstructionCost: number | null;
    } | null;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertGeometry = useMutation(
    trpc.variant.upsertGeometry.mutationOptions({
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
  const g = variant.geometry;

  const [showPhppIndicators, setShowPhppIndicators] = useState(
    Boolean(
      g?.totalThermalEnvelope ||
        g?.avgUvalueOpaque ||
        g?.avgUvalueGlazing ||
        g?.avgHeatRecovery ||
        g?.airTightness ||
        g?.pvInstalledCapacity ||
        g?.windowArea ||
        g?.manualDesignConstructionCost
    )
  );

  const [showUnheated, setShowUnheated] = useState(
    Boolean(
      g?.balconiesArea ||
        g?.otherSurfacesArea ||
        g?.unheatedGFA ||
        g?.unheatedNFA ||
        g?.unheatedGrossVol ||
        g?.unheatedNetVol
    )
  );

  const form = useForm<GeometryValues>({
    resolver: zodResolver(geometrySchema),
    mode: "onBlur",
    defaultValues: {
      grossFloorArea: g?.grossFloorArea ?? null,
      netFloorArea: g?.netFloorArea ?? null,
      treatedFloorArea: g?.treatedFloorArea ?? null,
      windowArea: g?.windowArea ?? null,
      balconiesArea: g?.balconiesArea ?? null,
      otherSurfacesArea: g?.otherSurfacesArea ?? null,
      unheatedGFA: g?.unheatedGFA ?? null,
      unheatedNFA: g?.unheatedNFA ?? null,
      grossVolume: g?.grossVolume ?? null,
      netVolume: g?.netVolume ?? null,
      unheatedGrossVol: g?.unheatedGrossVol ?? null,
      unheatedNetVol: g?.unheatedNetVol ?? null,
      totalThermalEnvelope: g?.totalThermalEnvelope ?? null,
      avgUvalueOpaque: g?.avgUvalueOpaque ?? null,
      avgUvalueGlazing: g?.avgUvalueGlazing ?? null,
      avgHeatRecovery: g?.avgHeatRecovery ?? null,
      airTightness: g?.airTightness ?? null,
      pvInstalledCapacity: g?.pvInstalledCapacity ?? null,
      manualDesignConstructionCost: g?.manualDesignConstructionCost ?? null,
    },
  });

  const onSave = useCallback(
    async (values: GeometryValues) => {
      await upsertGeometry.mutateAsync({ variantId, ...values });
    },
    [variantId, upsertGeometry]
  );

  useAutosave({ control: form.control, onSave });

  const watched = form.watch([
    "grossFloorArea",
    "netFloorArea",
    "treatedFloorArea",
  ]);
  const [grossFloorArea, netFloorArea, treatedFloorArea] = watched;

  const geometryWarning = useMemo(() => {
    if (
      typeof treatedFloorArea === "number" &&
      typeof grossFloorArea === "number" &&
      treatedFloorArea > grossFloorArea &&
      grossFloorArea > 0
    ) {
      return "Note: Treated floor area (TFA) is larger than Gross floor area (GFA). Typically TFA ≤ GFA.";
    }
    return null;
  }, [grossFloorArea, treatedFloorArea]);

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">
              Building Surfaces & Volumes (Heated)
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter the heated reference surfaces.{" "}
              <strong>Treated Floor Area (TFA)</strong> is the reference area used
              to calculate all {UNITS.EUR_m2} and {UNITS.kWh_m2_y} indicators.
            </p>
          </div>
          {(!treatedFloorArea || treatedFloorArea === 0) &&
            typeof netFloorArea === "number" &&
            netFloorArea > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("treatedFloorArea", netFloorArea, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  void onSave({
                    ...form.getValues(),
                    treatedFloorArea: netFloorArea,
                  });
                }}
              >
                Copy Net Floor Area ({netFloorArea} {UNITS.m2}) to TFA
              </Button>
            )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3 sm:col-span-2 lg:col-span-1">
            <NumberInput
              name="treatedFloorArea"
              control={form.control}
              label="Treated Floor Area (TFA) *"
              suffix={` ${UNITS.m2}`}
              hint="PHPP reference area (or NFA)"
              ariaLabel={`Treated floor area in ${UNIT_LABELS.m2}`}
            />
          </div>
          <div className="p-3">
            <NumberInput
              name="grossFloorArea"
              control={form.control}
              label="Gross Floor Area (GFA)"
              suffix={` ${UNITS.m2}`}
              hint="Total heated external area"
              ariaLabel={`Gross floor area in ${UNIT_LABELS.m2}`}
            />
          </div>
          <div className="p-3">
            <NumberInput
              name="netFloorArea"
              control={form.control}
              label="Net Floor Area (NFA)"
              suffix={` ${UNITS.m2}`}
              hint="Usable heated internal area"
              ariaLabel={`Net floor area in ${UNIT_LABELS.m2}`}
            />
          </div>
          <div className="p-3">
            <NumberInput
              name="grossVolume"
              control={form.control}
              label="Gross Volume"
              suffix={` ${UNITS.m3}`}
              hint="Heated gross volume"
              ariaLabel={`Gross volume in ${UNIT_LABELS.m3}`}
            />
          </div>
          <div className="p-3">
            <NumberInput
              name="netVolume"
              control={form.control}
              label="Net Volume"
              suffix={` ${UNITS.m3}`}
              hint="Heated net volume"
              ariaLabel={`Net volume in ${UNIT_LABELS.m3}`}
            />
          </div>
        </div>

        {geometryWarning && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            {geometryWarning}
          </p>
        )}

        {/* Collapsible Optional Sections */}
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowPhppIndicators((v) => !v)}
          >
            {showPhppIndicators ? (
              <ChevronUp className="mr-1.5 size-3.5" />
            ) : (
              <ChevronDown className="mr-1.5 size-3.5" />
            )}
            PHPP & Envelope Indicators (Optional)
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowUnheated((v) => !v)}
          >
            {showUnheated ? (
              <ChevronUp className="mr-1.5 size-3.5" />
            ) : (
              <ChevronDown className="mr-1.5 size-3.5" />
            )}
            Unheated & Secondary Areas (Optional)
          </Button>
        </div>

        {showPhppIndicators && (
          <div className="mt-3 rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  Energy Tool (PHPP) & Cost Verification Indicators
                </h3>
                <p className="text-xs text-muted-foreground">
                  Descriptive parameters from the energy model. Not required to
                  compute LCC totals.
                </p>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                Optional
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberInput
                name="totalThermalEnvelope"
                control={form.control}
                label="Thermal Envelope Area"
                suffix={` ${UNITS.m2}`}
              />
              <NumberInput
                name="windowArea"
                control={form.control}
                label="Windows Area"
                suffix={` ${UNITS.m2}`}
              />
              <NumberInput
                name="avgUvalueOpaque"
                control={form.control}
                label="Avg U-value Opaque"
                suffix={` ${UNITS.uvalue}`}
                decimalScale={3}
                ariaLabel={`Average opaque U-value in ${UNIT_LABELS.uvalue}`}
              />
              <NumberInput
                name="avgUvalueGlazing"
                control={form.control}
                label="Avg U-value Glazing"
                suffix={` ${UNITS.uvalue}`}
                decimalScale={3}
                ariaLabel={`Average glazing U-value in ${UNIT_LABELS.uvalue}`}
              />
              <NumberInput
                name="avgHeatRecovery"
                control={form.control}
                label="Heat Recovery Efficiency"
                suffix=" %"
              />
              <NumberInput
                name="airTightness"
                control={form.control}
                label="Air Tightness (n50)"
                suffix=" 1/h"
                decimalScale={2}
              />
              <NumberInput
                name="pvInstalledCapacity"
                control={form.control}
                label="PV Installed Capacity"
                suffix=" kWp"
              />
              <CurrencyInput
                name="manualDesignConstructionCost"
                control={form.control}
                label="Manual Total Cost Check"
              />
            </div>
          </div>
        )}

        {showUnheated && (
          <div className="mt-3 rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  Unheated Areas & Secondary Surfaces
                </h3>
                <p className="text-xs text-muted-foreground">
                  Garages, cellars, balconies, and other unheated spaces.
                </p>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                Optional
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberInput
                name="unheatedGFA"
                control={form.control}
                label="Unheated GFA"
                suffix={` ${UNITS.m2}`}
              />
              <NumberInput
                name="unheatedNFA"
                control={form.control}
                label="Unheated NFA"
                suffix={` ${UNITS.m2}`}
              />
              <NumberInput
                name="unheatedGrossVol"
                control={form.control}
                label="Unheated Gross Volume"
                suffix={` ${UNITS.m3}`}
              />
              <NumberInput
                name="unheatedNetVol"
                control={form.control}
                label="Unheated Net Volume"
                suffix={` ${UNITS.m3}`}
              />
              <NumberInput
                name="balconiesArea"
                control={form.control}
                label="Balconies & Terraces"
                suffix={` ${UNITS.m2}`}
              />
              <NumberInput
                name="otherSurfacesArea"
                control={form.control}
                label="Other Surfaces"
                suffix={` ${UNITS.m2}`}
              />
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// -- Income Section --

function IncomeSection({
  variant,
  variantId,
  projectId,
}: {
  variant: {
    incomeInput: {
      rent1MonthlyPerM2: number | null;
      rent1Area: number | null;
      rent1Taxes: number | null;
      rent2MonthlyPerM2: number | null;
      rent2Area: number | null;
      rent2Taxes: number | null;
      rent3MonthlyPerM2: number | null;
      rent3Area: number | null;
      rent3Taxes: number | null;
      otherIncome1: number | null;
      otherIncome1Taxes: number | null;
      otherIncome2: number | null;
      otherIncome2Taxes: number | null;
      otherIncome3: number | null;
      otherIncome3Taxes: number | null;
      expectedPricePerM2: number | null;
    } | null;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertIncome = useMutation(
    trpc.variant.upsertIncomeInput.mutationOptions({
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
  const inc = variant.incomeInput;
  const [showIncome, setShowIncome] = useState(
    Boolean(
      inc?.rent1MonthlyPerM2 ||
        inc?.rent2MonthlyPerM2 ||
        inc?.rent3MonthlyPerM2 ||
        inc?.otherIncome1 ||
        inc?.otherIncome2 ||
        inc?.otherIncome3 ||
        inc?.expectedPricePerM2
    )
  );

  const form = useForm<IncomeValues>({
    resolver: zodResolver(incomeSchema),
    mode: "onBlur",
    defaultValues: {
      rent1MonthlyPerM2: inc?.rent1MonthlyPerM2 ?? null,
      rent1Area: inc?.rent1Area ?? null,
      rent1Taxes: inc?.rent1Taxes ?? null,
      rent2MonthlyPerM2: inc?.rent2MonthlyPerM2 ?? null,
      rent2Area: inc?.rent2Area ?? null,
      rent2Taxes: inc?.rent2Taxes ?? null,
      rent3MonthlyPerM2: inc?.rent3MonthlyPerM2 ?? null,
      rent3Area: inc?.rent3Area ?? null,
      rent3Taxes: inc?.rent3Taxes ?? null,
      otherIncome1: inc?.otherIncome1 ?? null,
      otherIncome1Taxes: inc?.otherIncome1Taxes ?? null,
      otherIncome2: inc?.otherIncome2 ?? null,
      otherIncome2Taxes: inc?.otherIncome2Taxes ?? null,
      otherIncome3: inc?.otherIncome3 ?? null,
      otherIncome3Taxes: inc?.otherIncome3Taxes ?? null,
      expectedPricePerM2: inc?.expectedPricePerM2 ?? null,
    },
  });

  const onSave = useCallback(
    async (values: IncomeValues) => {
      await upsertIncome.mutateAsync({ variantId, ...values });
    },
    [variantId, upsertIncome]
  );

  useAutosave({ control: form.control, onSave });

  const clearValues: IncomeValues = {
    rent1MonthlyPerM2: 0,
    rent1Area: 0,
    rent1Taxes: 0,
    rent2MonthlyPerM2: 0,
    rent2Area: 0,
    rent2Taxes: 0,
    rent3MonthlyPerM2: 0,
    rent3Area: 0,
    rent3Taxes: 0,
    otherIncome1: 0,
    otherIncome1Taxes: 0,
    otherIncome2: 0,
    otherIncome2Taxes: 0,
    otherIncome3: 0,
    otherIncome3Taxes: 0,
    expectedPricePerM2: 0,
  };

  const handleDisableIncome = async () => {
    form.reset(clearValues);
    await upsertIncome.mutateAsync({ variantId, ...clearValues });
    setShowIncome(false);
  };

  if (!showIncome) {
    return (
      <GlassCard className="py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Rental & Operational Income (Optional)
            </span>
            <Badge variant="secondary" className="text-[11px]">
              Not enabled
            </Badge>
            <span className="hidden text-xs text-muted-foreground md:inline">
              — Enable only if you want to calculate Simple Payback or Income NPV.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowIncome(true)}
          >
            Enable Income Data
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Income & Revenues</h2>
          <p className="text-xs text-muted-foreground">
            Operational revenues from rent or other sources (used for payback and
            NPV; does not alter LCC/WLC totals).
          </p>
        </div>
        <ConfirmAction
          title="Clear income data?"
          description="This will reset all rent and income fields to zero and hide the section."
          confirmLabel="Clear & hide"
          onConfirm={handleDisableIncome}
          trigger={
            <Button type="button" variant="outline" size="sm">
              Disable Income
            </Button>
          }
        />
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rental Income
          </h3>
          <div className="space-y-3">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="grid gap-4 sm:grid-cols-3">
                <CurrencyInput
                  name={`rent${n}MonthlyPerM2`}
                  control={form.control}
                  label={`Rent ${n} — Monthly/${UNITS.m2}`}
                />
                <NumberInput
                  name={`rent${n}Area`}
                  control={form.control}
                  label={`Rent ${n} — Rented Area`}
                  suffix={` ${UNITS.m2}`}
                />
                <CurrencyInput
                  name={`rent${n}Taxes`}
                  control={form.control}
                  label={`Rent ${n} — Annual Taxes (€/y)`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Other Annual Income & Expected Building Price
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CurrencyInput
              name="otherIncome1"
              control={form.control}
              label="Other Income 1 (€/y)"
            />
            <CurrencyInput
              name="otherIncome1Taxes"
              control={form.control}
              label="Other 1 — Taxes (€/y)"
            />
            <CurrencyInput
              name="otherIncome2"
              control={form.control}
              label="Other Income 2 (€/y)"
            />
            <CurrencyInput
              name="expectedPricePerM2"
              control={form.control}
              label="Expected Selling Price"
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

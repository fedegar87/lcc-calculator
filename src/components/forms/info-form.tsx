"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
import { NumberInput } from "@/components/forms/shared/number-input";
import { PercentInput } from "@/components/forms/shared/percent-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/shared/info-tooltip";

const BUILDING_USE_OPTIONS = [
  { value: "RESIDENTIAL_SINGLE", label: "Residential (Single)" },
  { value: "RESIDENTIAL_MULTI", label: "Residential (Multi)" },
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

// -- Component --

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
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project || !variant) return null;

  return (
    <div className="space-y-6">
      <MetadataSection project={project} projectId={projectId} />
      <GeometrySection variant={variant} variantId={variantId} />
      <IncomeSection variant={variant} variantId={variantId} />
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
  const updateProject = useMutation(trpc.project.update.mutationOptions());

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
      buildingUse: (project.buildingUse as MetadataValues["buildingUse"]) ?? "RESIDENTIAL_MULTI",
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

  const { register, formState: { errors } } = form;

  return (
      <GlassCard>
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold">Project profile</h2>
          <p className="text-sm text-muted-foreground">
            Start with the project identity and the building use. The rest of the
            form adapts around these choices.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="name">Project Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="region">Region</Label>
          <Input id="region" {...register("region")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="author">Author</Label>
          <Input id="author" {...register("author")} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label>Building Use</Label>
            <InfoTooltip content="The building use drives which inputs are treated as core for preview and validation." />
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
            {...register("constructionYear")}
          />
        </div>
      </div>
    </GlassCard>
  );
}

// -- Geometry Section --

function GeometrySection({
  variant,
  variantId,
}: {
  variant: {
    geometry: {
      grossFloorArea: number;
      netFloorArea: number;
      treatedFloorArea: number;
      windowArea: number;
      balconiesArea: number;
      otherSurfacesArea: number;
      unheatedGFA: number;
      unheatedNFA: number;
      grossVolume: number;
      netVolume: number;
      unheatedGrossVol: number;
      unheatedNetVol: number;
      totalThermalEnvelope: number;
      avgUvalueOpaque: number;
      avgUvalueGlazing: number;
      avgHeatRecovery: number;
      airTightness: number;
      pvInstalledCapacity: number;
      manualDesignConstructionCost: number;
    } | null;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertGeometry = useMutation(trpc.variant.upsertGeometry.mutationOptions());
  const g = variant.geometry;
  const [showAdvanced, setShowAdvanced] = useState(
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
      grossFloorArea: g?.grossFloorArea ?? 0,
      netFloorArea: g?.netFloorArea ?? 0,
      treatedFloorArea: g?.treatedFloorArea ?? 0,
      windowArea: g?.windowArea ?? 0,
      balconiesArea: g?.balconiesArea ?? 0,
      otherSurfacesArea: g?.otherSurfacesArea ?? 0,
      unheatedGFA: g?.unheatedGFA ?? 0,
      unheatedNFA: g?.unheatedNFA ?? 0,
      grossVolume: g?.grossVolume ?? 0,
      netVolume: g?.netVolume ?? 0,
      unheatedGrossVol: g?.unheatedGrossVol ?? 0,
      unheatedNetVol: g?.unheatedNetVol ?? 0,
      totalThermalEnvelope: g?.totalThermalEnvelope ?? 0,
      avgUvalueOpaque: g?.avgUvalueOpaque ?? 0,
      avgUvalueGlazing: g?.avgUvalueGlazing ?? 0,
      avgHeatRecovery: g?.avgHeatRecovery ?? 0,
      airTightness: g?.airTightness ?? 0,
      pvInstalledCapacity: g?.pvInstalledCapacity ?? 0,
      manualDesignConstructionCost: g?.manualDesignConstructionCost ?? 0,
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
    "avgUvalueOpaque",
    "airTightness",
  ]);
  const [
    grossFloorArea,
    netFloorArea,
    treatedFloorArea,
    avgUvalueOpaque,
    airTightness,
  ] = watched;

  const geometryWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (
      typeof treatedFloorArea === "number" &&
      typeof grossFloorArea === "number" &&
      treatedFloorArea > grossFloorArea &&
      grossFloorArea > 0
    ) {
      warnings.push("Treated floor area is greater than gross floor area.");
    }
    if (
      typeof netFloorArea === "number" &&
      typeof grossFloorArea === "number" &&
      netFloorArea > grossFloorArea &&
      grossFloorArea > 0
    ) {
      warnings.push("Net floor area is greater than gross floor area.");
    }
    if (
      typeof avgUvalueOpaque === "number" &&
      avgUvalueOpaque > 0 &&
      (avgUvalueOpaque < 0.05 || avgUvalueOpaque > 3)
    ) {
      warnings.push("Opaque U-value is outside the usual building range.");
    }
    if (
      typeof airTightness === "number" &&
      airTightness > 0 &&
      (airTightness < 0.1 || airTightness > 20)
    ) {
      warnings.push("Air tightness looks unusual for a 1/h input.");
    }

    return warnings;
  }, [airTightness, avgUvalueOpaque, grossFloorArea, netFloorArea, treatedFloorArea]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <div>
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold">Geometry essentials</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the heated building first. These values unlock the main
                  readiness checks and per-area KPIs.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NumberInput
                  name="grossFloorArea"
                  control={form.control}
                  label="Gross Floor Area"
                  suffix=" m2"
                />
                <NumberInput
                  name="netFloorArea"
                  control={form.control}
                  label="Net Floor Area"
                  suffix=" m2"
                />
                <NumberInput
                  name="treatedFloorArea"
                  control={form.control}
                  label="Treated Floor Area"
                  suffix=" m2"
                  hint="Used for LCC/m2 and WLC/m2."
                />
                <NumberInput
                  name="grossVolume"
                  control={form.control}
                  label="Gross Volume"
                  suffix=" m3"
                />
                <NumberInput
                  name="netVolume"
                  control={form.control}
                  label="Net Volume"
                  suffix=" m3"
                />
                <NumberInput
                  name="windowArea"
                  control={form.control}
                  label="Window Area"
                  suffix=" m2"
                />
              </div>
            </div>

            <div>
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold">Envelope and systems</h2>
                <p className="text-sm text-muted-foreground">
                  Add the core thermal indicators next. Advanced secondary areas
                  stay hidden until you need them.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NumberInput
                  name="totalThermalEnvelope"
                  control={form.control}
                  label="Total Thermal Envelope"
                  suffix=" m2"
                />
                <NumberInput
                  name="avgUvalueOpaque"
                  control={form.control}
                  label="Avg U-value Opaque"
                  suffix=" W/m2K"
                  decimalScale={3}
                />
                <NumberInput
                  name="avgUvalueGlazing"
                  control={form.control}
                  label="Avg U-value Glazing"
                  suffix=" W/m2K"
                  decimalScale={3}
                />
                <NumberInput
                  name="avgHeatRecovery"
                  control={form.control}
                  label="Avg Heat Recovery"
                  suffix=" %"
                />
                <NumberInput
                  name="airTightness"
                  control={form.control}
                  label="Air Tightness"
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
                  label="Manual Design & Construction Cost"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced((current) => !current)}
              >
                {showAdvanced ? "Hide advanced geometry" : "Show advanced geometry"}
              </Button>

              {showAdvanced && (
                <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <NumberInput
                    name="balconiesArea"
                    control={form.control}
                    label="Balconies Area"
                    suffix=" m2"
                  />
                  <NumberInput
                    name="otherSurfacesArea"
                    control={form.control}
                    label="Other Surfaces"
                    suffix=" m2"
                  />
                  <NumberInput
                    name="unheatedGFA"
                    control={form.control}
                    label="Unheated GFA"
                    suffix=" m2"
                  />
                  <NumberInput
                    name="unheatedNFA"
                    control={form.control}
                    label="Unheated NFA"
                    suffix=" m2"
                  />
                  <NumberInput
                    name="unheatedGrossVol"
                    control={form.control}
                    label="Unheated Gross Volume"
                    suffix=" m3"
                  />
                  <NumberInput
                    name="unheatedNetVol"
                    control={form.control}
                    label="Unheated Net Volume"
                    suffix=" m3"
                  />
                </div>
              )}
            </div>

            {geometryWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:bg-amber-950/20">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Review these geometry warnings
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-900/90 dark:text-amber-100/90">
                  {geometryWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">Area definitions</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="font-medium">GFA</div>
                <p className="text-muted-foreground">
                  Area measured to the external building envelope.
                </p>
              </div>
              <div>
                <div className="font-medium">NFA</div>
                <p className="text-muted-foreground">
                  Usable internal area after walls and major structure are excluded.
                </p>
              </div>
              <div>
                <div className="font-medium">TFA</div>
                <p className="text-muted-foreground">
                  Conditioned area used for per-area LCC KPIs.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-3 text-muted-foreground">
                TFA should usually be less than or equal to GFA.
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// -- Income Section --

function IncomeSection({
  variant,
  variantId,
}: {
  variant: {
    incomeInput: {
      rent1MonthlyPerM2: number;
      rent1Area: number;
      rent1Taxes: number;
      rent2MonthlyPerM2: number;
      rent2Area: number;
      rent2Taxes: number;
      rent3MonthlyPerM2: number;
      rent3Area: number;
      rent3Taxes: number;
      otherIncome1: number;
      otherIncome1Taxes: number;
      otherIncome2: number;
      otherIncome2Taxes: number;
      otherIncome3: number;
      otherIncome3Taxes: number;
      expectedPricePerM2: number;
    } | null;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertIncome = useMutation(trpc.variant.upsertIncomeInput.mutationOptions());
  const inc = variant.incomeInput;
  const [showIncome, setShowIncome] = useState(
    Boolean(
      inc?.rent1MonthlyPerM2 ||
        inc?.rent2MonthlyPerM2 ||
        inc?.rent3MonthlyPerM2 ||
        inc?.otherIncome1 ||
        inc?.otherIncome2 ||
        inc?.otherIncome3
    )
  );

  const form = useForm<IncomeValues>({
    resolver: zodResolver(incomeSchema),
    mode: "onBlur",
    defaultValues: {
      rent1MonthlyPerM2: inc?.rent1MonthlyPerM2 ?? 0,
      rent1Area: inc?.rent1Area ?? 0,
      rent1Taxes: inc?.rent1Taxes ?? 0,
      rent2MonthlyPerM2: inc?.rent2MonthlyPerM2 ?? 0,
      rent2Area: inc?.rent2Area ?? 0,
      rent2Taxes: inc?.rent2Taxes ?? 0,
      rent3MonthlyPerM2: inc?.rent3MonthlyPerM2 ?? 0,
      rent3Area: inc?.rent3Area ?? 0,
      rent3Taxes: inc?.rent3Taxes ?? 0,
      otherIncome1: inc?.otherIncome1 ?? 0,
      otherIncome1Taxes: inc?.otherIncome1Taxes ?? 0,
      otherIncome2: inc?.otherIncome2 ?? 0,
      otherIncome2Taxes: inc?.otherIncome2Taxes ?? 0,
      otherIncome3: inc?.otherIncome3 ?? 0,
      otherIncome3Taxes: inc?.otherIncome3Taxes ?? 0,
      expectedPricePerM2: inc?.expectedPricePerM2 ?? 0,
    },
  });

  const onSave = useCallback(
    async (values: IncomeValues) => {
      await upsertIncome.mutateAsync({ variantId, ...values });
    },
    [variantId, upsertIncome]
  );

  useAutosave({ control: form.control, onSave });

  if (!showIncome) {
    return (
      <GlassCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Income analysis</h2>
            <p className="text-sm text-muted-foreground">
              Enable this only if you want payback and NPV-style profitability
              indicators. It does not change LCC or WLC totals.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowIncome(true)}
          >
            Enable income inputs
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Income input</h2>
          <p className="text-sm text-muted-foreground">
            Use this section when the study includes rent or other income. Leave
            it disabled for cost-only comparisons.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowIncome(false)}
        >
          Hide income inputs
        </Button>
      </div>

      <div className="space-y-6">
        {/* Rent rows */}
        {([1, 2, 3] as const).map((n) => (
          <div key={n}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Rent {n}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <CurrencyInput
                name={`rent${n}MonthlyPerM2` as keyof IncomeValues}
                control={form.control}
                label="Monthly / m2"
              />
              <CurrencyInput
                name={`rent${n}Area` as keyof IncomeValues}
                control={form.control}
                label="Area (m2)"
              />
              <PercentInput
                name={`rent${n}Taxes` as keyof IncomeValues}
                control={form.control}
                label="Tax Rate"
              />
            </div>
          </div>
        ))}

        {/* Other income rows */}
        {([1, 2, 3] as const).map((n) => (
          <div key={`other-${n}`}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Other Income {n}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyInput
                name={`otherIncome${n}` as keyof IncomeValues}
                control={form.control}
                label="Amount"
              />
              <PercentInput
                name={`otherIncome${n}Taxes` as keyof IncomeValues}
                control={form.control}
                label="Tax Rate"
              />
            </div>
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyInput
            name="expectedPricePerM2"
            control={form.control}
            label="Expected Price / m2"
          />
        </div>
      </div>
    </GlassCard>
  );
}

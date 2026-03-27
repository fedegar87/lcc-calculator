"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
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
      <h2 className="mb-4 text-lg font-semibold">Project Information</h2>
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
          <Label>Building Use</Label>
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

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Areas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyInput name="grossFloorArea" control={form.control} label="Gross Floor Area (m2)" />
          <CurrencyInput name="netFloorArea" control={form.control} label="Net Floor Area (m2)" />
          <CurrencyInput name="treatedFloorArea" control={form.control} label="Treated Floor Area (m2)" />
          <CurrencyInput name="windowArea" control={form.control} label="Window Area (m2)" />
          <CurrencyInput name="balconiesArea" control={form.control} label="Balconies Area (m2)" />
          <CurrencyInput name="otherSurfacesArea" control={form.control} label="Other Surfaces (m2)" />
          <CurrencyInput name="unheatedGFA" control={form.control} label="Unheated GFA (m2)" />
          <CurrencyInput name="unheatedNFA" control={form.control} label="Unheated NFA (m2)" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Volumes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyInput name="grossVolume" control={form.control} label="Gross Volume (m3)" />
          <CurrencyInput name="netVolume" control={form.control} label="Net Volume (m3)" />
          <CurrencyInput name="unheatedGrossVol" control={form.control} label="Unheated Gross Vol. (m3)" />
          <CurrencyInput name="unheatedNetVol" control={form.control} label="Unheated Net Vol. (m3)" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Thermal Envelope & Indicators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyInput name="totalThermalEnvelope" control={form.control} label="Total Thermal Envelope (m2)" />
          <CurrencyInput name="avgUvalueOpaque" control={form.control} label="Avg U-value Opaque (W/m2K)" />
          <CurrencyInput name="avgUvalueGlazing" control={form.control} label="Avg U-value Glazing (W/m2K)" />
          <CurrencyInput name="avgHeatRecovery" control={form.control} label="Avg Heat Recovery (%)" />
          <CurrencyInput name="airTightness" control={form.control} label="Air Tightness (1/h)" />
          <CurrencyInput name="pvInstalledCapacity" control={form.control} label="PV Installed Capacity (kWp)" />
          <CurrencyInput name="manualDesignConstructionCost" control={form.control} label="Design & Construction Cost" />
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

  return (
    <GlassCard>
      <h2 className="mb-4 text-lg font-semibold">Income Input</h2>

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

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
import { SliderInput } from "@/components/shared/slider-input";
import { PercentInput } from "@/components/forms/shared/percent-input";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumericFormat } from "react-number-format";
import { UNITS } from "@/lib/units";
import { getMethodDefaults } from "@/engine/method-profiles";
import { ArrowLeft, ArrowRight, Plus, Sun } from "lucide-react";

// -- Boundary Schema --

const boundarySchema = z.object({
  referencePeriod: z.number().int().min(1).max(100),
  interestRate: z.number().min(-0.1).max(0.5),
  inflationRate: z.number().min(-0.1).max(0.5),
  stakeholderRole: z.number().int().optional().nullable(),
});

type BoundaryValues = z.infer<typeof boundarySchema>;

const energyPriceRowSchema = z.object({
  index: z.number().int(),
  name: z.string(),
  pricePerKwh: z.number(),
  annualIncrease: z.number(),
});

const energyPricesSchema = z.object({
  prices: z.array(energyPriceRowSchema),
});

type EnergyPricesValues = z.infer<typeof energyPricesSchema>;

const STAKEHOLDER_ROLE_OPTIONS = [
  { value: "1", label: "Owner / Investor" },
  { value: "2", label: "Tenant / Occupant" },
  { value: "3", label: "Third Party / ESCO" },
] as const;

const legacyDefaults = getMethodDefaults("CRAVEZERO_LEGACY");

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function computeRealRate(nominalRate: number, inflationRate: number) {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

// -- Energy Demand Schema --

const END_USE_ROWS = [
  {
    label: "Space Heating",
    endUse1: "HEATING_1",
    endUse2: "HEATING_2",
    tooltip: "Delivered energy for space heating (kWh/m²y).",
  },
  {
    label: "Space Cooling",
    endUse1: "COOLING_1",
    endUse2: "COOLING_2",
    tooltip: "Delivered energy for space cooling (kWh/m²y).",
  },
  {
    label: "Domestic Hot Water (DHW)",
    endUse1: "DHW_1",
    endUse2: "DHW_2",
    tooltip: "Delivered energy for domestic hot water (kWh/m²y).",
  },
  {
    label: "Household / Auxiliary Electricity",
    endUse1: "HOUSEHOLD_ELECTRICITY",
    endUse2: null,
    tooltip: "Appliances, lighting, and auxiliary electricity (kWh/m²y).",
  },
] as const;

type EndUseValue =
  | "HEATING_1"
  | "HEATING_2"
  | "COOLING_1"
  | "COOLING_2"
  | "DHW_1"
  | "DHW_2"
  | "HOUSEHOLD_ELECTRICITY"
  | "PV_PRODUCTION";

type SystemFieldName =
  | "heating1"
  | "heating2"
  | "cooling1"
  | "cooling2"
  | "dhw1"
  | "dhw2"
  | "household";

const ROW_FIELD_MAP: Record<
  string,
  { sys1: SystemFieldName; sys2: SystemFieldName | null }
> = {
  "Space Heating": { sys1: "heating1", sys2: "heating2" },
  "Space Cooling": { sys1: "cooling1", sys2: "cooling2" },
  "Domestic Hot Water (DHW)": { sys1: "dhw1", sys2: "dhw2" },
  "Household / Auxiliary Electricity": { sys1: "household", sys2: null },
};

const energyRowSchema = z.object({
  endUse: z.string(),
  energySourceIndex: z.number().int().min(1).max(19),
  specificConsumption: z.number().min(0).nullable().optional(),
});

const energyInputsSchema = z.object({
  heating1: energyRowSchema,
  heating2: energyRowSchema,
  cooling1: energyRowSchema,
  cooling2: energyRowSchema,
  dhw1: energyRowSchema,
  dhw2: energyRowSchema,
  household: energyRowSchema,
  pvProductionMode: z.enum(["total", "specific"]),
  pvProductionKwh: z.number().min(0).nullable().optional(),
  pvSpecificProduction: z.number().min(0).nullable().optional(),
});

type EnergyInputsValues = z.infer<typeof energyInputsSchema>;

interface EnergyFormProps {
  variantId: string;
}

function getExistingInput(
  inputs: Array<{
    endUse: string;
    energySourceIndex: number;
    specificConsumption: number;
    pvProductionKwh: number;
  }>,
  endUse: string
) {
  return inputs.find((ei) => ei.endUse === endUse);
}

export function EnergyForm({ variantId }: EnergyFormProps) {
  const trpc = useTRPC();

  const { data: variant, isPending: variantPending } = useQuery(
    trpc.variant.getById.queryOptions({ variantId })
  );

  const { data: energySources, isPending: sourcesPending } = useQuery(
    trpc.reference.energySources.queryOptions()
  );

  if (variantPending || sourcesPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!variant || !energySources) return null;

  const projectId = variant.projectId;
  const treatedFloorArea = variant.geometry?.treatedFloorArea ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Economic Boundary Conditions */}
      <BoundaryConditionSection
        variant={variant}
        variantId={variantId}
        projectId={projectId}
      />

      {/* 2. Energy Demand & PV Production */}
      <EnergyConsumptionSection
        variant={variant}
        variantId={variantId}
        projectId={projectId}
        energySources={energySources}
        treatedFloorArea={treatedFloorArea}
      />

      {/* 3. Energy Tariffs & Price Escalation */}
      <EnergyPricesSection
        variant={variant}
        variantId={variantId}
        projectId={projectId}
        energySources={energySources}
      />

      {/* Step Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          render={
            <Link
              href={`/projects/${projectId}/info?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          <ArrowLeft className="mr-1.5 size-4" />
          1. Project & Geometry
        </Button>
        <Button
          render={
            <Link
              href={`/projects/${projectId}/construction?v=${encodeURIComponent(variantId)}`}
            />
          }
        >
          Next: 3. Costs & Maintenance
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  );
}

// -- 1. Boundary Conditions Section --

function BoundaryConditionSection({
  variant,
  variantId,
  projectId,
}: {
  variant: {
    boundaryCondition: Record<string, unknown> | null;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertBC = useMutation(
    trpc.variant.upsertBoundaryCondition.mutationOptions({
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
  const bc = variant.boundaryCondition;

  const form = useForm<BoundaryValues>({
    resolver: zodResolver(boundarySchema),
    mode: "onBlur",
    defaultValues: {
      referencePeriod:
        (bc?.referencePeriod as number) ?? legacyDefaults.referencePeriod,
      interestRate: (bc?.interestRate as number) ?? legacyDefaults.interestRate,
      inflationRate:
        (bc?.inflationRate as number) ?? legacyDefaults.inflationRate,
      stakeholderRole: (bc?.stakeholderRole as number) ?? 1,
    },
  });

  const onSave = useCallback(
    async (values: BoundaryValues) => {
      await upsertBC.mutateAsync({
        variantId,
        referencePeriod: values.referencePeriod,
        interestRate: values.interestRate,
        inflationRate: values.inflationRate,
        stakeholderRole: values.stakeholderRole ?? undefined,
      });
    },
    [variantId, upsertBC]
  );

  useAutosave({ control: form.control, onSave });

  const interestRate = form.watch("interestRate");
  const inflationRate = form.watch("inflationRate");
  const derivedRealRate = useMemo(
    () => computeRealRate(interestRate ?? 0, inflationRate ?? 0),
    [inflationRate, interestRate]
  );

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">
            Economic Boundary Conditions
          </h2>
          <p className="text-xs text-muted-foreground">
            Study period and discount rates used to actualize operational and
            maintenance cash flows (Project Information — Part II).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            Real Discount Rate (RR):
          </span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatPercent(derivedRealRate)}
          </span>
          <InfoTooltip content="Automatically calculated from Nominal Interest Rate and Inflation Rate: RR = (1 + Rint) / (1 + Ri) - 1." />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <SliderInput
            name="referencePeriod"
            control={form.control}
            label="Reference Period (Years) *"
            min={1}
            max={100}
            step={1}
            unit="years"
            tooltip="ISO 15686-5 study horizon (typically 30–50 years; 40 years in CRAVEzero case studies)."
          />
        </div>

        <PercentInput
          name="interestRate"
          control={form.control}
          label="Nominal Interest Rate (Rint) *"
          hint="e.g. 1.51% in Solallén"
        />

        <PercentInput
          name="inflationRate"
          control={form.control}
          label="Inflation Rate (Ri) *"
          hint="e.g. 0.56% in Solallén"
        />

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label>Viewing Perspective</Label>
            <InfoTooltip content="Stakeholder perspective for the study (Owner, Tenant, or Third Party)." />
          </div>
          <Controller
            name="stakeholderRole"
            control={form.control}
            render={({ field: { value, onChange } }) => (
              <Select
                value={value != null ? String(value) : "1"}
                onValueChange={(v) => onChange(v ? Number(v) : 1)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select perspective..." />
                </SelectTrigger>
                <SelectContent>
                  {STAKEHOLDER_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </GlassCard>
  );
}

// -- 2. Energy Demand & PV Production Section --

function EnergyConsumptionSection({
  variant,
  variantId,
  projectId,
  energySources,
  treatedFloorArea,
}: {
  variant: {
    boundaryCondition: Record<string, unknown> | null;
    energyInputs: Array<{
      endUse: string;
      energySourceIndex: number;
      specificConsumption: number;
      pvProductionKwh: number;
    }>;
  };
  variantId: string;
  projectId: string;
  energySources: Array<{ index: number; name: string; category: string }>;
  treatedFloorArea: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertEnergy = useMutation(
    trpc.variant.upsertEnergyInputs.mutationOptions({
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

  const ei = variant.energyInputs;
  const pvInput = getExistingInput(ei, "PV_PRODUCTION");
  const selectableSources = energySources.filter((source) => source.index !== 1);

  const existingPrices = useMemo(() => {
    const raw = (variant.boundaryCondition?.energyPrices ?? []) as Array<{
      index: number;
      pricePerKwh: number;
      annualIncrease: number;
    }>;
    return new Map(raw.map((p) => [p.index, p]));
  }, [variant.boundaryCondition?.energyPrices]);

  const defaultRow = (endUse: string) => {
    const existing = getExistingInput(ei, endUse);
    return {
      endUse,
      energySourceIndex: existing?.energySourceIndex ?? 1,
      specificConsumption: existing?.specificConsumption ?? 0,
    };
  };

  const hasAnySecondSystem = Boolean(
    (getExistingInput(ei, "HEATING_2")?.specificConsumption ?? 0) > 0 ||
      (getExistingInput(ei, "COOLING_2")?.specificConsumption ?? 0) > 0 ||
      (getExistingInput(ei, "DHW_2")?.specificConsumption ?? 0) > 0
  );
  const [showSecondSystem, setShowSecondSystem] = useState(hasAnySecondSystem);

  const form = useForm<EnergyInputsValues>({
    resolver: zodResolver(energyInputsSchema),
    mode: "onBlur",
    defaultValues: {
      heating1: defaultRow("HEATING_1"),
      heating2: defaultRow("HEATING_2"),
      cooling1: defaultRow("COOLING_1"),
      cooling2: defaultRow("COOLING_2"),
      dhw1: defaultRow("DHW_1"),
      dhw2: defaultRow("DHW_2"),
      household: defaultRow("HOUSEHOLD_ELECTRICITY"),
      pvProductionMode:
        (pvInput?.pvProductionKwh ?? 0) > 0 ||
        (pvInput?.specificConsumption ?? 0) === 0
          ? "total"
          : "specific",
      pvProductionKwh: pvInput?.pvProductionKwh ?? 0,
      pvSpecificProduction: pvInput?.specificConsumption ?? 0,
    },
  });

  const onSave = useCallback(
    async (values: EnergyInputsValues) => {
      const inputs: Array<{
        endUse: EndUseValue;
        energySourceIndex: number;
        specificConsumption?: number | null;
        pvProductionKwh?: number | null;
      }> = [
        {
          endUse: "HEATING_1",
          energySourceIndex: values.heating1.energySourceIndex,
          specificConsumption: values.heating1.specificConsumption,
        },
        {
          endUse: "HEATING_2",
          energySourceIndex: values.heating2.energySourceIndex,
          specificConsumption: values.heating2.specificConsumption,
        },
        {
          endUse: "COOLING_1",
          energySourceIndex: values.cooling1.energySourceIndex,
          specificConsumption: values.cooling1.specificConsumption,
        },
        {
          endUse: "COOLING_2",
          energySourceIndex: values.cooling2.energySourceIndex,
          specificConsumption: values.cooling2.specificConsumption,
        },
        {
          endUse: "DHW_1",
          energySourceIndex: values.dhw1.energySourceIndex,
          specificConsumption: values.dhw1.specificConsumption,
        },
        {
          endUse: "DHW_2",
          energySourceIndex: values.dhw2.energySourceIndex,
          specificConsumption: values.dhw2.specificConsumption,
        },
        {
          endUse: "HOUSEHOLD_ELECTRICITY",
          energySourceIndex: values.household.energySourceIndex,
          specificConsumption: values.household.specificConsumption,
        },
        {
          endUse: "PV_PRODUCTION",
          energySourceIndex: 13,
          specificConsumption:
            values.pvProductionMode === "specific"
              ? values.pvSpecificProduction
              : null,
          pvProductionKwh:
            values.pvProductionMode === "total"
              ? values.pvProductionKwh
              : null,
        },
      ];

      await upsertEnergy.mutateAsync({ variantId, inputs });
    },
    [upsertEnergy, variantId]
  );

  useAutosave({ control: form.control, onSave });

  const values = form.watch();

  const renderSourceSelect = (
    name: `${SystemFieldName}.energySourceIndex`,
    placeholder: string
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Select
          value={String(field.value)}
          onValueChange={(value) => field.onChange(parseInt(value ?? "1", 10))}
        >
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">— None / Not used —</SelectItem>
            {selectableSources.map((source) => (
              <SelectItem key={source.index} value={String(source.index)}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  const renderConsumptionInput = (
    name: `${SystemFieldName}.specificConsumption`,
    placeholder: string
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field: { onChange, value, ref, ...rest } }) => (
        <NumericFormat
          {...rest}
          getInputRef={ref}
          value={value as number}
          onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
          decimalScale={2}
          thousandSeparator=","
          customInput={Input}
          placeholder={placeholder}
          className="h-9 text-right tabular-nums"
        />
      )}
    />
  );

  const pvTotalKwh =
    values.pvProductionMode === "total"
      ? (values.pvProductionKwh ?? 0)
      : (values.pvSpecificProduction ?? 0) * treatedFloorArea;
  const pvPrice = existingPrices.get(13)?.pricePerKwh ?? 0;

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Building Energy Consumption & On-Site PV
          </h2>
          <p className="text-xs text-muted-foreground">
            Select the energy carrier for each end use and enter specific demand
            in <strong>{UNITS.kWh_m2_y}</strong>.{" "}
            {treatedFloorArea > 0 ? (
              <span>
                Total annual demand is calculated using TFA ={" "}
                <strong>
                  {treatedFloorArea.toLocaleString()} {UNITS.m2}
                </strong>
                .
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Set Treated Floor Area (TFA) in Tab 1 to compute total kWh/year.
              </span>
            )}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSecondSystem((v) => !v)}
        >
          <Plus className="mr-1.5 size-3.5" />
          {showSecondSystem
            ? "Hide 2nd / Bivalent System"
            : "Add 2nd / Bivalent System"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[210px]">End Use</TableHead>
              <TableHead className="min-w-[220px]">Energy Source</TableHead>
              <TableHead className="w-[150px] text-right">
                Specific ({UNITS.kWh_m2_y})
              </TableHead>
              <TableHead className="w-[140px] text-right">
                Total ({UNITS.kWh_y})
              </TableHead>
              <TableHead className="w-[130px] text-right">
                Year 1 Cost (€/y)
              </TableHead>
              {showSecondSystem && (
                <>
                  <TableHead className="min-w-[200px]">
                    2nd Source (Optional)
                  </TableHead>
                  <TableHead className="w-[140px] text-right">
                    2nd ({UNITS.kWh_m2_y})
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {END_USE_ROWS.map((row) => {
              const fields = ROW_FIELD_MAP[row.label];
              if (!fields) return null;

              const sys1Val = values[fields.sys1];
              const sys2Val = fields.sys2 ? values[fields.sys2] : null;
              const kwh1 = (sys1Val.specificConsumption ?? 0) * treatedFloorArea;
              const kwh2 = sys2Val
                ? (sys2Val.specificConsumption ?? 0) * treatedFloorArea
                : 0;
              const price1 =
                sys1Val.energySourceIndex > 1
                  ? (existingPrices.get(sys1Val.energySourceIndex)?.pricePerKwh ??
                    0)
                  : 0;
              const price2 =
                sys2Val && sys2Val.energySourceIndex > 1
                  ? (existingPrices.get(sys2Val.energySourceIndex)?.pricePerKwh ??
                    0)
                  : 0;
              const annualCost = kwh1 * price1 + kwh2 * price2;

              return (
                <TableRow key={row.label}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-1.5">
                      <span>{row.label}</span>
                      <InfoTooltip content={row.tooltip} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderSourceSelect(
                      `${fields.sys1}.energySourceIndex`,
                      "Select source"
                    )}
                  </TableCell>
                  <TableCell>
                    {renderConsumptionInput(
                      `${fields.sys1}.specificConsumption`,
                      "0.00"
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {(kwh1 + kwh2).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    €
                    {annualCost.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  {showSecondSystem && (
                    <>
                      <TableCell>
                        {fields.sys2 ? (
                          renderSourceSelect(
                            `${fields.sys2}.energySourceIndex`,
                            "Optional 2nd source"
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {fields.sys2 ? (
                          renderConsumptionInput(
                            `${fields.sys2}.specificConsumption`,
                            "0.00"
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Integrated PV Production Bar */}
      <div className="mt-5 rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sun className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Photovoltaic (PV) Electricity Production
              </h3>
              <p className="text-xs text-muted-foreground">
                Annual on-site PV generation (offsets operational energy cost).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => form.setValue("pvProductionMode", "total")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  values.pvProductionMode === "total"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Total ({UNITS.kWh_y})
              </button>
              <button
                type="button"
                onClick={() => form.setValue("pvProductionMode", "specific")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  values.pvProductionMode === "specific"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Specific ({UNITS.kWh_m2_y})
              </button>
            </div>

            {values.pvProductionMode === "total" ? (
              <div className="w-40">
                <Controller
                  name="pvProductionKwh"
                  control={form.control}
                  render={({ field: { onChange, value, ref, ...rest } }) => (
                    <NumericFormat
                      {...rest}
                      getInputRef={ref}
                      value={value as number}
                      onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                      decimalScale={2}
                      thousandSeparator=","
                      suffix={` ${UNITS.kWh_y}`}
                      customInput={Input}
                      className="h-9 text-right tabular-nums"
                    />
                  )}
                />
              </div>
            ) : (
              <div className="w-40">
                <Controller
                  name="pvSpecificProduction"
                  control={form.control}
                  render={({ field: { onChange, value, ref, ...rest } }) => (
                    <NumericFormat
                      {...rest}
                      getInputRef={ref}
                      value={value as number}
                      onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                      decimalScale={2}
                      thousandSeparator=","
                      suffix={` ${UNITS.kWh_m2_y}`}
                      customInput={Input}
                      className="h-9 text-right tabular-nums"
                    />
                  )}
                />
              </div>
            )}

            <div className="text-right text-xs text-muted-foreground">
              <div>
                Annual output:{" "}
                <strong className="text-foreground tabular-nums">
                  {pvTotalKwh.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  {UNITS.kWh_y}
                </strong>
              </div>
              <div>
                Year 1 offset:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                  €
                  {(pvTotalKwh * pvPrice).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                  /y
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// -- 3. Energy Tariffs & Escalation Section --

function EnergyPricesSection({
  variant,
  variantId,
  projectId,
  energySources,
}: {
  variant: {
    boundaryCondition: Record<string, unknown> | null;
    energyInputs: Array<{
      endUse: string;
      energySourceIndex: number;
      specificConsumption: number;
      pvProductionKwh: number;
    }>;
  };
  variantId: string;
  projectId: string;
  energySources: Array<{ index: number; name: string; category: string }>;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertBC = useMutation(
    trpc.variant.upsertBoundaryCondition.mutationOptions({
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
  const [showAllSources, setShowAllSources] = useState(false);

  const existingPrices = (variant.boundaryCondition?.energyPrices ?? []) as Array<{
    index: number;
    name: string;
    pricePerKwh: number;
    annualIncrease: number;
  }>;

  const defaultPrices = energySources.map((source) => {
    const existing = existingPrices.find((p) => p.index === source.index);
    return {
      index: source.index,
      name: source.name,
      pricePerKwh: existing?.pricePerKwh ?? 0,
      annualIncrease: existing?.annualIncrease ?? 0,
    };
  });

  const selectableSources = energySources.filter((source) => source.index !== 1);
  const activeSourceIndices = new Set(
    variant.energyInputs
      .filter(
        (input) =>
          input.energySourceIndex > 1 &&
          ((input.specificConsumption ?? 0) > 0 ||
            (input.pvProductionKwh ?? 0) > 0 ||
            input.endUse !== "PV_PRODUCTION")
      )
      .map((input) => input.energySourceIndex)
  );
  // Also include any carrier that already has a non-zero price configured
  existingPrices.forEach((p) => {
    if (p.pricePerKwh > 0 && p.index > 1) {
      activeSourceIndices.add(p.index);
    }
  });

  const prioritizedSources = selectableSources.filter((source) =>
    activeSourceIndices.has(source.index)
  );
  const visibleSources =
    showAllSources || prioritizedSources.length === 0
      ? selectableSources
      : prioritizedSources;
  const visibleSourceIndexSet = new Set(
    visibleSources.map((source) => source.index)
  );
  const hiddenSourceCount = selectableSources.length - visibleSources.length;

  const form = useForm<EnergyPricesValues>({
    resolver: zodResolver(energyPricesSchema),
    mode: "onBlur",
    defaultValues: { prices: defaultPrices },
  });

  const onSave = useCallback(
    async (values: EnergyPricesValues) => {
      await upsertBC.mutateAsync({
        variantId,
        energyPrices: values.prices,
      });
    },
    [variantId, upsertBC]
  );

  useAutosave({ control: form.control, onSave });

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Energy Vector Prices & Annual Increase
          </h2>
          <p className="text-xs text-muted-foreground">
            Unit price (EUR/kWh) and annual price escalation rate (%/year) for
            the selected energy carriers.
          </p>
        </div>
        {hiddenSourceCount > 0 || showAllSources ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAllSources((current) => !current)}
          >
            {showAllSources
              ? "Show active carriers only"
              : `Show all ${selectableSources.length} energy carriers`}
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[240px]">Energy Carrier</TableHead>
              <TableHead className="w-[180px]">Unit Price (EUR/kWh)</TableHead>
              <TableHead className="w-[180px]">Annual Price Increase (%/y)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultPrices.map((row, i) => {
              if (!visibleSourceIndexSet.has(row.index)) {
                return null;
              }

              const isUsedInDemand = variant.energyInputs.some(
                (ei) =>
                  ei.energySourceIndex === row.index &&
                  ((ei.specificConsumption ?? 0) > 0 ||
                    (ei.pvProductionKwh ?? 0) > 0)
              );

              return (
                <TableRow key={row.index}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <span>{row.name}</span>
                      {isUsedInDemand && (
                        <Badge variant="secondary" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`prices.${i}.pricePerKwh`}
                      control={form.control}
                      render={({ field: { onChange, value, ref, ...field } }) => (
                        <NumericFormat
                          {...field}
                          getInputRef={ref}
                          value={value as number}
                          onValueChange={(vals) =>
                            onChange(vals.floatValue ?? 0)
                          }
                          decimalScale={4}
                          fixedDecimalScale
                          thousandSeparator=","
                          customInput={Input}
                          className="h-8 w-36 text-right tabular-nums"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`prices.${i}.annualIncrease`}
                      control={form.control}
                      render={({ field: { onChange, value, ref, ...field } }) => (
                        <NumericFormat
                          {...field}
                          getInputRef={ref}
                          value={typeof value === "number" ? value * 100 : 0}
                          onValueChange={(vals) => {
                            const v = vals.floatValue;
                            onChange(v != null ? v / 100 : 0);
                          }}
                          decimalScale={2}
                          suffix=" %"
                          customInput={Input}
                          className="h-8 w-32 text-right tabular-nums"
                        />
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

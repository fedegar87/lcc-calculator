"use client";

import { useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { SliderInput } from "@/components/shared/slider-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

// -- Types & Constants --

const END_USE_ROWS = [
  { label: "Heating", endUse1: "HEATING_1", endUse2: "HEATING_2", tooltip: "Space heating energy consumption" },
  { label: "Cooling", endUse1: "COOLING_1", endUse2: "COOLING_2", tooltip: "Space cooling energy consumption" },
  { label: "DHW", endUse1: "DHW_1", endUse2: "DHW_2", tooltip: "Domestic hot water energy consumption" },
  { label: "Household Electricity", endUse1: "HOUSEHOLD_ELECTRICITY", endUse2: null, tooltip: "Household electricity consumption (lighting, appliances)" },
] as const;

type EndUseValue =
  | "HEATING_1" | "HEATING_2"
  | "COOLING_1" | "COOLING_2"
  | "DHW_1" | "DHW_2"
  | "HOUSEHOLD_ELECTRICITY"
  | "PV_PRODUCTION";

// -- Schemas --

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
  pvProductionKwh: z.number().min(0).nullable().optional(),
});

type EnergyInputsValues = z.infer<typeof energyInputsSchema>;

const maintenanceSchema = z.object({
  buildingElementMaintenancePercent: z.number().min(0).max(100),
});

type MaintenanceValues = z.infer<typeof maintenanceSchema>;

// -- Component --

interface EnergyFormProps {
  variantId: string;
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
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!variant || !energySources) return null;

  return (
    <div className="space-y-6">
      <EnergyConsumptionSection
        variant={variant}
        variantId={variantId}
        energySources={energySources}
      />
      <MaintenanceConfigSection variant={variant} variantId={variantId} />
    </div>
  );
}

// -- Energy Consumption Section --

function getExistingInput(
  inputs: Array<{ endUse: string; energySourceIndex: number; specificConsumption: number; pvProductionKwh: number }>,
  endUse: string,
) {
  return inputs.find((ei) => ei.endUse === endUse);
}

function EnergyConsumptionSection({
  variant,
  variantId,
  energySources,
}: {
  variant: {
    energyInputs: Array<{
      endUse: string;
      energySourceIndex: number;
      specificConsumption: number;
      pvProductionKwh: number;
    }>;
  };
  variantId: string;
  energySources: Array<{ index: number; name: string; category: string }>;
}) {
  const trpc = useTRPC();
  const upsertEnergy = useMutation(
    trpc.variant.upsertEnergyInputs.mutationOptions()
  );

  const ei = variant.energyInputs;
  const pvInput = getExistingInput(ei, "PV_PRODUCTION");

  const defaultRow = (endUse: string) => {
    const existing = getExistingInput(ei, endUse);
    return {
      endUse,
      energySourceIndex: existing?.energySourceIndex ?? 2,
      specificConsumption: existing?.specificConsumption ?? 0,
    };
  };

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
      pvProductionKwh: pvInput?.pvProductionKwh ?? 0,
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
        { endUse: "HEATING_1", energySourceIndex: values.heating1.energySourceIndex, specificConsumption: values.heating1.specificConsumption },
        { endUse: "HEATING_2", energySourceIndex: values.heating2.energySourceIndex, specificConsumption: values.heating2.specificConsumption },
        { endUse: "COOLING_1", energySourceIndex: values.cooling1.energySourceIndex, specificConsumption: values.cooling1.specificConsumption },
        { endUse: "COOLING_2", energySourceIndex: values.cooling2.energySourceIndex, specificConsumption: values.cooling2.specificConsumption },
        { endUse: "DHW_1", energySourceIndex: values.dhw1.energySourceIndex, specificConsumption: values.dhw1.specificConsumption },
        { endUse: "DHW_2", energySourceIndex: values.dhw2.energySourceIndex, specificConsumption: values.dhw2.specificConsumption },
        { endUse: "HOUSEHOLD_ELECTRICITY", energySourceIndex: values.household.energySourceIndex, specificConsumption: values.household.specificConsumption },
        { endUse: "PV_PRODUCTION", energySourceIndex: 2, pvProductionKwh: values.pvProductionKwh },
      ];

      await upsertEnergy.mutateAsync({ variantId, inputs });
    },
    [variantId, upsertEnergy]
  );

  useAutosave({ control: form.control, onSave });

  // Map row keys to form field names
  const rowFieldMap: Record<string, { sys1: `${"heating1" | "heating2" | "cooling1" | "cooling2" | "dhw1" | "dhw2" | "household"}`; sys2: `${"heating1" | "heating2" | "cooling1" | "cooling2" | "dhw1" | "dhw2" | "household"}` | null }> = {
    Heating: { sys1: "heating1", sys2: "heating2" },
    Cooling: { sys1: "cooling1", sys2: "cooling2" },
    DHW: { sys1: "dhw1", sys2: "dhw2" },
    "Household Electricity": { sys1: "household", sys2: null },
  };

  return (
    <>
      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Energy Consumption</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">End Use</TableHead>
                <TableHead className="w-[200px]">Energy Source</TableHead>
                <TableHead>System 1 (kWh/m2/yr)</TableHead>
                <TableHead>System 2 (kWh/m2/yr)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {END_USE_ROWS.map((row) => {
                const fields = rowFieldMap[row.label];
                if (!fields) return null;

                return (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        {row.label}
                        <InfoTooltip content={row.tooltip} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`${fields.sys1}.energySourceIndex`}
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={String(field.value)}
                            onValueChange={(v) => field.onChange(parseInt(v ?? "0", 10))}
                          >
                            <SelectTrigger className="h-8 w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {energySources.map((src) => (
                                <SelectItem key={src.index} value={String(src.index)}>
                                  {src.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`${fields.sys1}.specificConsumption`}
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
                            className="h-8 w-32"
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {fields.sys2 ? (
                        <Controller
                          name={`${fields.sys2}.specificConsumption`}
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
                              className="h-8 w-32"
                            />
                          )}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">PV Production</h2>
          <InfoTooltip content="Total annual PV electricity production in kWh" />
        </div>
        <div className="max-w-sm">
          <Label htmlFor="pvProduction">PV Production (kWh/year)</Label>
          <Controller
            name="pvProductionKwh"
            control={form.control}
            render={({ field: { onChange, value, ref, ...rest } }) => (
              <NumericFormat
                {...rest}
                getInputRef={ref}
                id="pvProduction"
                value={value as number}
                onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                decimalScale={2}
                thousandSeparator=","
                customInput={Input}
                className="mt-1"
              />
            )}
          />
        </div>
      </GlassCard>
    </>
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

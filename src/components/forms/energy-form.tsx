"use client";

import { useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlassCard } from "@/components/shared/glass-card";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const END_USE_ROWS = [
  {
    label: "Heating",
    endUse1: "HEATING_1",
    endUse2: "HEATING_2",
    tooltip:
      "Enter delivered energy for space heating. Use system 2 only when the building really has a second heating source.",
  },
  {
    label: "Cooling",
    endUse1: "COOLING_1",
    endUse2: "COOLING_2",
    tooltip:
      "Enter delivered energy for space cooling. Leave system 2 empty if one system covers the full load.",
  },
  {
    label: "DHW",
    endUse1: "DHW_1",
    endUse2: "DHW_2",
    tooltip:
      "Domestic hot water demand. Use system 2 only when DHW is split across two energy carriers.",
  },
  {
    label: "Household Electricity",
    endUse1: "HOUSEHOLD_ELECTRICITY",
    endUse2: null,
    tooltip:
      "Lighting and appliance electricity. This row is typically relevant for residential studies.",
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
  Heating: { sys1: "heating1", sys2: "heating2" },
  Cooling: { sys1: "cooling1", sys2: "cooling2" },
  DHW: { sys1: "dhw1", sys2: "dhw2" },
  "Household Electricity": { sys1: "household", sys2: null },
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

function renderSourceLabel(source: { name: string; category: string }) {
  if (source.category === "energy_carrier") {
    return `${source.name} [carrier]`;
  }

  return `${source.name} [fuel]`;
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
        projectId={variant.projectId}
        energySources={energySources}
      />
    </div>
  );
}

function EnergyConsumptionSection({
  variant,
  variantId,
  projectId,
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
  projectId: string;
  energySources: Array<{ index: number; name: string; category: string }>;
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
  const isMobile = useIsMobile();

  const ei = variant.energyInputs;
  const pvInput = getExistingInput(ei, "PV_PRODUCTION");
  const selectableSources = energySources.filter((source) => source.index !== 1);

  const defaultRow = (endUse: string) => {
    const existing = getExistingInput(ei, endUse);
    return {
      endUse,
      energySourceIndex: existing?.energySourceIndex ?? 1,
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
      pvProductionMode:
        (pvInput?.pvProductionKwh ?? 0) > 0 ? "total" : "specific",
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
  const validationHints = useMemo(() => {
    const hints: string[] = [];

    (Object.values(ROW_FIELD_MAP) as Array<{
      sys1: SystemFieldName;
      sys2: SystemFieldName | null;
    }>).forEach(({ sys1, sys2 }) => {
      const system1 = values[sys1];
      if (
        system1.energySourceIndex === 1 &&
        (system1.specificConsumption ?? 0) > 0
      ) {
        hints.push(`${system1.endUse} has consumption entered but no source selected.`);
      }

      if (
        system1.energySourceIndex > 1 &&
        (system1.specificConsumption ?? 0) === 0
      ) {
        hints.push(`${system1.endUse} has a source selected but zero consumption.`);
      }

      if (!sys2) return;

      const system2 = values[sys2];
      if (
        system2.energySourceIndex === 1 &&
        (system2.specificConsumption ?? 0) > 0
      ) {
        hints.push(`${system2.endUse} has consumption entered but no source selected.`);
      }
    });

    if (
      values.pvProductionMode === "total" &&
      (values.pvProductionKwh ?? 0) === 0
    ) {
      hints.push("PV production is set to total annual mode but the value is zero.");
    }

    if (
      values.pvProductionMode === "specific" &&
      (values.pvSpecificProduction ?? 0) === 0
    ) {
      hints.push("PV production is set to specific mode but the value is zero.");
    }

    return hints;
  }, [values]);

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
            <SelectItem value="1">Not selected</SelectItem>
            {selectableSources.map((source) => (
              <SelectItem key={source.index} value={String(source.index)}>
                {renderSourceLabel(source)}
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
          className="h-9"
        />
      )}
    />
  );

  return (
    <>
      <GlassCard>
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold">Energy consumption</h2>
          <p className="text-sm text-muted-foreground">
            Enter delivered energy by end use. Source 2 is optional and should
            only be used when the project genuinely mixes systems.
          </p>
        </div>

        <div className="mb-4 rounded-xl border bg-muted/25 p-4 text-sm text-muted-foreground">
          Consumption inputs are specific values in `kWh/m2/year`. Rows marked
          as `Not selected` are ignored by the cost calculation.
        </div>

        {isMobile ? (
          <div className="space-y-4">
            {END_USE_ROWS.map((row) => {
              const fields = ROW_FIELD_MAP[row.label];
              if (!fields) return null;

              return (
                <div key={row.label} className="rounded-2xl border bg-muted/15 p-4">
                  <div className="mb-3 flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold">{row.label}</h3>
                    <InfoTooltip content={row.tooltip} />
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>Source 1</Label>
                      {renderSourceSelect(
                        `${fields.sys1}.energySourceIndex`,
                        "Select primary source"
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label>System 1 consumption</Label>
                      {renderConsumptionInput(
                        `${fields.sys1}.specificConsumption`,
                        "kWh/m2/year"
                      )}
                    </div>

                    {fields.sys2 ? (
                      <>
                        <div className="grid gap-1.5">
                          <Label>Source 2</Label>
                          {renderSourceSelect(
                            `${fields.sys2}.energySourceIndex`,
                            "Optional secondary source"
                          )}
                        </div>
                        <div className="grid gap-1.5">
                          <Label>System 2 consumption</Label>
                          {renderConsumptionInput(
                            `${fields.sys2}.specificConsumption`,
                            "kWh/m2/year"
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[190px]">End Use</TableHead>
                  <TableHead className="w-[220px]">Source 1</TableHead>
                  <TableHead>System 1 (kWh/m2/year)</TableHead>
                  <TableHead className="w-[220px]">Source 2</TableHead>
                  <TableHead>System 2 (kWh/m2/year)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {END_USE_ROWS.map((row) => {
                  const fields = ROW_FIELD_MAP[row.label];
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
                        {renderSourceSelect(
                          `${fields.sys1}.energySourceIndex`,
                          "Select source"
                        )}
                      </TableCell>
                      <TableCell>
                        {renderConsumptionInput(
                          `${fields.sys1}.specificConsumption`,
                          "kWh/m2/year"
                        )}
                      </TableCell>
                      <TableCell>
                        {fields.sys2 ? (
                          renderSourceSelect(
                            `${fields.sys2}.energySourceIndex`,
                            "Optional second source"
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {fields.sys2 ? (
                          renderConsumptionInput(
                            `${fields.sys2}.specificConsumption`,
                            "kWh/m2/year"
                          )
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
        )}

        {validationHints.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:bg-amber-950/20">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Review these energy inputs
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-amber-900/90 dark:text-amber-100/90">
              {validationHints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">PV production</h2>
          <InfoTooltip content="Choose whether you want to enter PV as a project total in kWh/year or as a specific value in kWh/m2/year. The engine supports both; this control makes the mode explicit." />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={
              form.watch("pvProductionMode") === "total" ? "default" : "outline"
            }
            onClick={() => form.setValue("pvProductionMode", "total")}
          >
            Total annual production
          </Button>
          <Button
            type="button"
            variant={
              form.watch("pvProductionMode") === "specific"
                ? "default"
                : "outline"
            }
            onClick={() => form.setValue("pvProductionMode", "specific")}
          >
            Specific production
          </Button>
        </div>

        {form.watch("pvProductionMode") === "total" ? (
          <div className="max-w-sm space-y-1">
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
            <p className="text-xs text-muted-foreground">
              Use this when you already know the full annual PV output for the
              project.
            </p>
          </div>
        ) : (
          <div className="max-w-sm space-y-1">
            <Label htmlFor="pvSpecificProduction">
              PV Production (kWh/m2/year)
            </Label>
            <Controller
              name="pvSpecificProduction"
              control={form.control}
              render={({ field: { onChange, value, ref, ...rest } }) => (
                <NumericFormat
                  {...rest}
                  getInputRef={ref}
                  id="pvSpecificProduction"
                  value={value as number}
                  onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                  decimalScale={2}
                  thousandSeparator=","
                  customInput={Input}
                  className="mt-1"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Use this when PV output is expressed as a specific value that the
              engine should scale with treated floor area.
            </p>
          </div>
        )}
      </GlassCard>
    </>
  );
}

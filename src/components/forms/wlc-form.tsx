"use client";

import { useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { SliderInput } from "@/components/shared/slider-input";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
import { PercentInput } from "@/components/forms/shared/percent-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { NumericFormat } from "react-number-format";

// -- Schemas --

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

const wlcInputSchema = z.object({
  landArea: z.number().nullable().optional(),
  buildingIndex: z.number().nullable().optional(),
  floorHeight: z.number().nullable().optional(),
  landPrice: z.number().nullable().optional(),
  enablingCost1: z.number().nullable().optional(),
  enablingCost2: z.number().nullable().optional(),
  planningFees1: z.number().nullable().optional(),
  planningFees2: z.number().nullable().optional(),
  userSupportPropMgmt: z.number().nullable().optional(),
  userSupportCharges: z.number().nullable().optional(),
  userSupportAdmin: z.number().nullable().optional(),
  financeCost: z.number().nullable().optional(),
});

type WLCInputValues = z.infer<typeof wlcInputSchema>;

const designCostRowSchema = z.object({
  lineNumber: z.number().int(),
  description: z.string(),
  preliminaryCost: z.number().optional(),
  definitiveCost: z.number().optional(),
  executiveCost: z.number().optional(),
  siteManagementCost: z.number().optional(),
});

const designCostsSchema = z.object({
  costs: z.array(designCostRowSchema),
});

type DesignCostsValues = z.infer<typeof designCostsSchema>;

// -- Component --

interface WLCFormProps {
  variantId: string;
}

export function WLCForm({ variantId }: WLCFormProps) {
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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!variant || !energySources) return null;

  return (
    <div className="space-y-6">
      <BoundaryConditionSection variant={variant} variantId={variantId} />
      <EnergyPricesSection
        variant={variant}
        variantId={variantId}
        energySources={energySources}
      />
      <NonConstructionSection variant={variant} variantId={variantId} />
      <DesignCostsSection variant={variant} variantId={variantId} />
    </div>
  );
}

// -- Boundary Conditions --

function BoundaryConditionSection({
  variant,
  variantId,
}: {
  variant: {
    boundaryCondition: Record<string, unknown> | null;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertBC = useMutation(trpc.variant.upsertBoundaryCondition.mutationOptions());
  const bc = variant.boundaryCondition;

  const form = useForm<BoundaryValues>({
    resolver: zodResolver(boundarySchema),
    mode: "onBlur",
    defaultValues: {
      referencePeriod: (bc?.referencePeriod as number) ?? 30,
      interestRate: (bc?.interestRate as number) ?? 0.03,
      inflationRate: (bc?.inflationRate as number) ?? 0.02,
      stakeholderRole: (bc?.stakeholderRole as number) ?? null,
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

  return (
    <GlassCard>
      <h2 className="mb-4 text-lg font-semibold">Boundary Conditions</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <SliderInput
            name="referencePeriod"
            control={form.control}
            label="Reference Period"
            min={1}
            max={100}
            step={1}
            unit="years"
            tooltip="Study period for LCC calculation (ISO 15686-5)"
          />
        </div>
        <PercentInput
          name="interestRate"
          control={form.control}
          label="Nominal Interest Rate"
        />
        <PercentInput
          name="inflationRate"
          control={form.control}
          label="Inflation Rate"
        />
      </div>
    </GlassCard>
  );
}

// -- Energy Prices --

function EnergyPricesSection({
  variant,
  variantId,
  energySources,
}: {
  variant: {
    boundaryCondition: Record<string, unknown> | null;
  };
  variantId: string;
  energySources: Array<{ index: number; name: string; category: string }>;
}) {
  const trpc = useTRPC();
  const upsertBC = useMutation(trpc.variant.upsertBoundaryCondition.mutationOptions());

  // Parse existing energy prices from boundary condition JSON
  const existingPrices = (variant.boundaryCondition?.energyPrices ?? []) as Array<{
    index: number;
    name: string;
    pricePerKwh: number;
    annualIncrease: number;
  }>;

  // Build default values: merge reference sources with existing data
  const defaultPrices = energySources.map((source) => {
    const existing = existingPrices.find((p) => p.index === source.index);
    return {
      index: source.index,
      name: source.name,
      pricePerKwh: existing?.pricePerKwh ?? 0,
      annualIncrease: existing?.annualIncrease ?? 0,
    };
  });

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
      <h2 className="mb-4 text-lg font-semibold">Energy Prices</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Source</TableHead>
              <TableHead>Price (EUR/kWh)</TableHead>
              <TableHead>Annual Increase (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultPrices.map((_, i) => (
              <TableRow key={energySources[i].index}>
                <TableCell className="font-medium text-sm">
                  {energySources[i].name}
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
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        decimalScale={4}
                        fixedDecimalScale
                        thousandSeparator=","
                        customInput={Input}
                        className="h-8 w-28"
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
                        className="h-8 w-28"
                      />
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

// -- Non-Construction Costs --

function NonConstructionSection({
  variant,
  variantId,
}: {
  variant: {
    wlcInput: Record<string, unknown> | null;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertWLC = useMutation(trpc.variant.upsertWLCInput.mutationOptions());
  const w = variant.wlcInput;
  const n = (key: string) => (w?.[key] as number) ?? 0;

  const form = useForm<WLCInputValues>({
    resolver: zodResolver(wlcInputSchema),
    mode: "onBlur",
    defaultValues: {
      landArea: n("landArea"),
      buildingIndex: n("buildingIndex"),
      floorHeight: n("floorHeight"),
      landPrice: n("landPrice"),
      enablingCost1: n("enablingCost1"),
      enablingCost2: n("enablingCost2"),
      planningFees1: n("planningFees1"),
      planningFees2: n("planningFees2"),
      userSupportPropMgmt: n("userSupportPropMgmt"),
      userSupportCharges: n("userSupportCharges"),
      userSupportAdmin: n("userSupportAdmin"),
      financeCost: n("financeCost"),
    },
  });

  const onSave = useCallback(
    async (values: WLCInputValues) => {
      await upsertWLC.mutateAsync({ variantId, ...values });
    },
    [variantId, upsertWLC]
  );

  useAutosave({ control: form.control, onSave });

  return (
    <GlassCard>
      <h2 className="mb-4 text-lg font-semibold">Non-Construction Costs</h2>
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Land
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CurrencyInput name="landArea" control={form.control} label="Land Area (m2)" />
            <CurrencyInput name="buildingIndex" control={form.control} label="Building Index" />
            <CurrencyInput name="floorHeight" control={form.control} label="Floor Height (m)" />
            <CurrencyInput name="landPrice" control={form.control} label="Land Price" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Enabling Costs
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyInput name="enablingCost1" control={form.control} label="Enabling Cost 1" />
            <CurrencyInput name="enablingCost2" control={form.control} label="Enabling Cost 2" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Planning Fees
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyInput name="planningFees1" control={form.control} label="Planning Fees 1" />
            <CurrencyInput name="planningFees2" control={form.control} label="Planning Fees 2" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            User Support
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <CurrencyInput name="userSupportPropMgmt" control={form.control} label="Property Management" />
            <CurrencyInput name="userSupportCharges" control={form.control} label="Charges" />
            <CurrencyInput name="userSupportAdmin" control={form.control} label="Administration" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Finance
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CurrencyInput name="financeCost" control={form.control} label="Finance Cost" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// -- Design Costs --

function DesignCostsSection({
  variant,
  variantId,
}: {
  variant: {
    designCosts: Array<Record<string, unknown>>;
  };
  variantId: string;
}) {
  const trpc = useTRPC();
  const upsertDesignCosts = useMutation(trpc.variant.upsertDesignCosts.mutationOptions());

  const defaultCosts = variant.designCosts.length > 0
    ? variant.designCosts.map((dc) => ({
        lineNumber: (dc.lineNumber as number) ?? 1,
        description: (dc.description as string) ?? "",
        preliminaryCost: (dc.preliminaryCost as number) ?? 0,
        definitiveCost: (dc.definitiveCost as number) ?? 0,
        executiveCost: (dc.executiveCost as number) ?? 0,
        siteManagementCost: (dc.siteManagementCost as number) ?? 0,
      }))
    : [
        {
          lineNumber: 1,
          description: "",
          preliminaryCost: 0,
          definitiveCost: 0,
          executiveCost: 0,
          siteManagementCost: 0,
        },
      ];

  const form = useForm<DesignCostsValues>({
    resolver: zodResolver(designCostsSchema),
    mode: "onBlur",
    defaultValues: { costs: defaultCosts },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costs",
  });

  const onSave = useCallback(
    async (values: DesignCostsValues) => {
      await upsertDesignCosts.mutateAsync({
        variantId,
        costs: values.costs,
      });
    },
    [variantId, upsertDesignCosts]
  );

  useAutosave({ control: form.control, onSave });

  const addRow = () => {
    const nextLine = fields.length > 0
      ? Math.max(...fields.map((_, i) => form.getValues(`costs.${i}.lineNumber`))) + 1
      : 1;
    append({
      lineNumber: nextLine,
      description: "",
      preliminaryCost: 0,
      definitiveCost: 0,
      executiveCost: 0,
      siteManagementCost: 0,
    });
  };

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Design Costs</h2>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          Add Line
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[160px]">Description</TableHead>
              <TableHead>Preliminary</TableHead>
              <TableHead>Definitive</TableHead>
              <TableHead>Executive</TableHead>
              <TableHead>Site Mgmt</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, i) => (
              <TableRow key={field.id}>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {form.watch(`costs.${i}.lineNumber`)}
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`costs.${i}.description`)}
                    className="h-8"
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.preliminaryCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        customInput={Input}
                        className="h-8 w-28"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.definitiveCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        customInput={Input}
                        className="h-8 w-28"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.executiveCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        customInput={Input}
                        className="h-8 w-28"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`costs.${i}.siteManagementCost`}
                    control={form.control}
                    render={({ field: { onChange, value, ref, ...rest } }) => (
                      <NumericFormat
                        {...rest}
                        getInputRef={ref}
                        value={value as number}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        customInput={Input}
                        className="h-8 w-28"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

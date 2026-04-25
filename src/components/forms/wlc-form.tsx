"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useAutosave } from "@/hooks/use-autosave";
import { GlassCard } from "@/components/shared/glass-card";
import { SliderInput } from "@/components/shared/slider-input";
import { CurrencyInput } from "@/components/forms/shared/currency-input";
import { NumberInput } from "@/components/forms/shared/number-input";
import { PercentInput } from "@/components/forms/shared/percent-input";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { useIsMobile } from "@/hooks/use-mobile";

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
  landCostMode: z.enum(["UNIT_PRICE", "TOTAL_COST"]),
  landArea: z.number().nullable().optional(),
  buildingIndex: z.number().nullable().optional(),
  floorHeight: z.number().nullable().optional(),
  landPrice: z.number().nullable().optional(),
  landCostTotal: z.number().nullable().optional(),
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

const STAKEHOLDER_ROLE_OPTIONS = [
  {
    value: "1",
    label: "Owner",
    help: "Use when the investor and building owner carry the capital and replacement costs.",
  },
  {
    value: "2",
    label: "Tenant",
    help: "Use when recurring charges and rent matter more than initial investment.",
  },
  {
    value: "3",
    label: "Third Party",
    help: "Use for ESCO or external operator cases where costs and benefits are split.",
  },
] as const;

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function computeRealRate(nominalRate: number, inflationRate: number) {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

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
      <BoundaryConditionSection
        variant={variant}
        variantId={variantId}
        projectId={variant.projectId}
      />
      <EnergyPricesSection
        variant={variant}
        variantId={variantId}
        projectId={variant.projectId}
        energySources={energySources}
      />
      <NonConstructionSection
        variant={variant}
        variantId={variantId}
        projectId={variant.projectId}
      />
      <DesignCostsSection variant={variant} variantId={variantId} />
    </div>
  );
}

// -- Boundary Conditions --

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
  const interestRate = form.watch("interestRate");
  const inflationRate = form.watch("inflationRate");
  const stakeholderRole = form.watch("stakeholderRole");
  const derivedRealRate = useMemo(
    () => computeRealRate(interestRate ?? 0, inflationRate ?? 0),
    [inflationRate, interestRate]
  );
  const selectedStakeholder = STAKEHOLDER_ROLE_OPTIONS.find(
    (option) => Number(option.value) === stakeholderRole
  );

  return (
    <GlassCard>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Boundary conditions</h2>
        <p className="text-sm text-muted-foreground">
          Set the discounting logic first. These values control how costs are
          escalated, discounted, and compared across the full reference period.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
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
              tooltip="Study period for the LCC calculation under ISO 15686-5."
            />
          </div>
          <PercentInput
            name="interestRate"
            control={form.control}
            label="Nominal Interest Rate"
            hint="Enter the loan or financing rate before inflation is removed."
          />
          <PercentInput
            name="inflationRate"
            control={form.control}
            label="Inflation Rate"
            hint="The app derives the real discount rate used in cost actualization."
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label>Stakeholder Role</Label>
              <InfoTooltip content="Choose the perspective that owns the cash flows in this study. This clarifies which costs and benefits matter when you interpret the result." />
            </div>
            <Controller
              name="stakeholderRole"
              control={form.control}
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value != null ? String(value) : ""}
                  onValueChange={(v) => onChange(v ? Number(v) : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role..." />
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
            {selectedStakeholder ? (
              <p className="text-xs text-muted-foreground">
                {selectedStakeholder.help}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Discounting preview</h3>
            <InfoTooltip content="The calculation engine works with a real discount rate. It is derived from the nominal rate and inflation rate so you do not need to calculate it manually." />
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border bg-background p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Derived real rate
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {formatPercent(derivedRealRate)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Computed as `(1 + nominal) / (1 + inflation) - 1`.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Nominal rate is what you pay or expect before inflation.
                Inflation is removed to derive the real rate used for
                discounting future costs.
              </p>
              <p>
                Energy costs still escalate with their own annual increase. The
                result here only controls how future values are discounted back
                to present value.
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// -- Energy Prices --

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
  const selectableSources = energySources.filter((source) => source.index !== 1);
  const activeSourceIndices = new Set(
    variant.energyInputs
      .map((input) => input.energySourceIndex)
      .filter((index) => index > 1)
  );
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
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Energy prices</h2>
            <InfoTooltip content="Only sources already used in this variant are shown first. Expand the full list when you want to preload alternative price assumptions before changing the energy systems." />
          </div>
          <p className="text-sm text-muted-foreground">
            Active sources come from the Energy step. Each row stores the
            current price and its annual escalation.
          </p>
        </div>
        {hiddenSourceCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAllSources((current) => !current)}
          >
            {showAllSources
              ? "Show active sources only"
              : `Show all ${selectableSources.length} sources`}
          </Button>
        ) : null}
      </div>
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
            {defaultPrices.map((row, i) => {
              if (!visibleSourceIndexSet.has(row.index)) {
                return null;
              }

              const isActive = activeSourceIndices.has(row.index);

              return (
                <TableRow key={row.index}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <span>{row.name}</span>
                      {isActive ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Used in this variant
                        </span>
                      ) : null}
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
                          onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                          decimalScale={4}
                          fixedDecimalScale
                          thousandSeparator=","
                          customInput={Input}
                          className="h-8 w-32"
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
              );
            })}
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
  projectId,
}: {
  variant: {
    wlcInput: Record<string, unknown> | null;
  };
  variantId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const upsertWLC = useMutation(
    trpc.variant.upsertWLCInput.mutationOptions({
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
  const w = variant.wlcInput;
  const n = (key: string) => (w?.[key] as number) ?? 0;
  const persistedMode =
    w?.landCostMode === "TOTAL_COST" ? "TOTAL_COST" : "UNIT_PRICE";
  const [showOptional, setShowOptional] = useState(
    Boolean(
      n("enablingCost1") ||
        n("enablingCost2") ||
        n("planningFees1") ||
        n("planningFees2") ||
        n("userSupportPropMgmt") ||
        n("userSupportCharges") ||
        n("userSupportAdmin") ||
        n("financeCost")
    )
  );

  const form = useForm<WLCInputValues>({
    resolver: zodResolver(wlcInputSchema),
    mode: "onBlur",
    defaultValues: {
      landCostMode: persistedMode,
      landArea: n("landArea"),
      buildingIndex: n("buildingIndex"),
      floorHeight: n("floorHeight"),
      landPrice: n("landPrice"),
      landCostTotal: n("landCostTotal"),
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

  const landCostMode = form.watch("landCostMode");
  const landArea = form.watch("landArea") ?? 0;
  const landPrice = form.watch("landPrice") ?? 0;
  const landCostTotal = form.watch("landCostTotal") ?? 0;
  const computedUnitPriceTotal = landArea * landPrice;
  const activeLandTotal =
    landCostMode === "TOTAL_COST" ? landCostTotal : computedUnitPriceTotal;

  const setLandCostMode = (mode: WLCInputValues["landCostMode"]) => {
    if (mode === "TOTAL_COST" && !form.getValues("landCostTotal")) {
      form.setValue("landCostTotal", computedUnitPriceTotal, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    form.setValue("landCostMode", mode, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <GlassCard>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Non-construction costs</h2>
          <p className="text-sm text-muted-foreground">
            Start with land assumptions. Enable the optional rows only when your
            study needs enabling, planning, user-support, or finance costs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowOptional((current) => !current)}
        >
          {showOptional ? "Hide optional costs" : "Show optional costs"}
        </Button>
      </div>
      <div className="space-y-6">
        <div>
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Land</h3>
              <InfoTooltip content="Choose whether the source workbook gives a land unit price or a total land cost. Older WLCC sheets often store land as one total amount." />
            </div>
            <div className="inline-flex w-fit rounded-lg border bg-muted p-1">
              {(["UNIT_PRICE", "TOTAL_COST"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={landCostMode === mode ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setLandCostMode(mode)}
                >
                  {mode === "UNIT_PRICE" ? "Unit price" : "Total cost"}
                </Button>
              ))}
            </div>
          </div>

          {landCostMode === "UNIT_PRICE" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberInput
                name="landArea"
                control={form.control}
                label="Land Area"
                suffix=" m2"
              />
              <NumberInput
                name="buildingIndex"
                control={form.control}
                label="Building Index"
                decimalScale={3}
                hint="Use the site-specific building index or floor area ratio."
              />
              <NumberInput
                name="floorHeight"
                control={form.control}
                label="Floor Height"
                suffix=" m"
              />
              <CurrencyInput
                name="landPrice"
                control={form.control}
                label="Land Price (EUR/m2)"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CurrencyInput
                name="landCostTotal"
                control={form.control}
                label="Land Cost Total"
              />
            </div>
          )}

          <div className="mt-3 rounded-lg border bg-muted/25 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Land cost used in WLC: </span>
            <span className="font-medium tabular-nums">
              {activeLandTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        {showOptional ? (
          <>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Enabling costs
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyInput
                  name="enablingCost1"
                  control={form.control}
                  label="Enabling Cost 1"
                />
                <CurrencyInput
                  name="enablingCost2"
                  control={form.control}
                  label="Enabling Cost 2"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Planning fees
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyInput
                  name="planningFees1"
                  control={form.control}
                  label="Planning Fee 1"
                />
                <CurrencyInput
                  name="planningFees2"
                  control={form.control}
                  label="Planning Fee 2"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                User support
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <CurrencyInput
                  name="userSupportPropMgmt"
                  control={form.control}
                  label="Property Management"
                />
                <CurrencyInput
                  name="userSupportCharges"
                  control={form.control}
                  label="Charges"
                />
                <CurrencyInput
                  name="userSupportAdmin"
                  control={form.control}
                  label="Administration"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Finance
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CurrencyInput
                  name="financeCost"
                  control={form.control}
                  label="Finance Cost"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            Optional non-construction costs are hidden. Enable them if the study
            must include planning, administration, or finance assumptions.
          </div>
        )}
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
  const isMobile = useIsMobile();

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
        <div>
          <h2 className="text-lg font-semibold">Design costs</h2>
          <p className="text-sm text-muted-foreground">
            Add only the lines that matter for this variant. Leave the rest at
            zero.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          Add Line
        </Button>
      </div>
      {isMobile ? (
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium">
                  Line {form.watch(`costs.${i}.lineNumber`)}
                </div>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3">
                <Input
                  {...form.register(`costs.${i}.description`)}
                  className="h-9"
                  placeholder="Description"
                />
                <div className="grid gap-3 sm:grid-cols-2">
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
                        placeholder="Preliminary"
                      />
                    )}
                  />
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
                        placeholder="Definitive"
                      />
                    )}
                  />
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
                        placeholder="Executive"
                      />
                    )}
                  />
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
                        placeholder="Site management"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </GlassCard>
  );
}

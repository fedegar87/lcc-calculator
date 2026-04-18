"use client";

import type { LCCResult } from "@/engine/types";
import { GlassCard } from "@/components/shared/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface ResultsAuditViewProps {
  result: LCCResult;
}

export function ResultsAuditView({ result }: ResultsAuditViewProps) {
  const auditRows = [
    {
      stage: "Investment",
      component: "Design costs",
      amount: result.designCosts,
      note: "Preliminary + definitive + executive design fees.",
    },
    {
      stage: "Investment",
      component: "Construction",
      amount: result.totalConstruction,
      note: "Resolved from material, unit-price, labor, and other detail rows.",
    },
    {
      stage: "Operation",
      component: "Energy consumed",
      amount: result.energyConsumed,
      note: "Heating + cooling + DHW + household electricity.",
    },
    {
      stage: "Operation",
      component: "PV produced",
      amount: -result.energyProduced,
      note: "Subtracted from operating energy cost.",
    },
    {
      stage: "Operation",
      component: "Maintenance",
      amount: result.maintenanceAtRefPeriod,
      note: "Building elements plus EN 15459 service components.",
    },
    {
      stage: "Operation",
      component: "Site management",
      amount: result.buildingSiteManagement,
      note: "Site management line items from the WLC input.",
    },
    {
      stage: "Whole life",
      component: "LCC",
      amount: result.lcc,
      note: "Investment plus operation and maintenance.",
    },
    {
      stage: "Whole life",
      component: "Non-construction",
      amount: result.nonConstructionCosts,
      note: "Land, enabling, planning, user-support, and finance assumptions.",
    },
    {
      stage: "Whole life",
      component: "WLC",
      amount: result.wlc,
      note: "LCC plus non-construction costs.",
    },
    {
      stage: "Residual",
      component: "Residual value",
      amount: -result.residualValue,
      note: "End-of-period residual value deducted from the gross total.",
    },
    {
      stage: "Residual",
      component: "LCC net residual",
      amount: result.lccNetResidual,
      note: "Final total after residual value is deducted.",
    },
  ];

  const referenceYears = [1, 5, 10, 20, result.heatingCosts.cumulated.length - 1]
    .filter((year, index, array) => year > 0 && array.indexOf(year) === index)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="text-base font-semibold">Audit trail</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This view shows how the total is assembled so the result can be
          checked section by section instead of treated as a black box.
        </p>

        <div className="mt-4 space-y-3">
          {auditRows.map((row) => (
            <div key={row.component} className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {row.stage}
                  </div>
                  <div className="text-sm font-medium">{row.component}</div>
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {row.amount < 0 ? "-" : ""}
                  {eurFormatter.format(Math.abs(row.amount))}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.note}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-base font-semibold">Reference-period checkpoints</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cumulated actualized costs at a few years within the reference period.
        </p>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Energy</TableHead>
                <TableHead className="text-right">Maintenance</TableHead>
                <TableHead className="text-right">Total O&M</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referenceYears.map((year) => {
                const index = year;
                const energyValue =
                  result.heatingCosts.cumulated[index] +
                  result.coolingCosts.cumulated[index] +
                  result.dhwCosts.cumulated[index] +
                  result.householdCosts.cumulated[index] -
                  result.pvProduction.cumulated[index];
                const maintenanceValue = result.maintenanceCumulated[index];

                return (
                  <TableRow key={year}>
                    <TableCell>{year}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eurFormatter.format(energyValue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eurFormatter.format(maintenanceValue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eurFormatter.format(energyValue + maintenanceValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}

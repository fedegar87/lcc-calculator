"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LCCResult } from "@/engine/types";

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const CATEGORY_LABELS: Record<string, string> = {
  A1_ROOFS: "A1 - Roofs",
  A2_FACADES: "A2 - Facades",
  A3_FLOORS: "A3 - Floors",
  A4_WALLS: "A4 - Walls",
  A5_WINDOWS: "A5 - Windows",
  A6_SHADING: "A6 - Shading",
  A7_DOORS: "A7 - Doors",
  A8_INTERNAL: "A8 - Internal",
  A9_STRUCTURE: "A9 - Structure",
  A10_OTHER: "A10 - Other",
  B1_HEATING: "B1 - Heating",
  B2_COOLING: "B2 - Cooling",
  B3_VENTILATION: "B3 - Ventilation",
  B4_HVAC_COMBINED: "B4 - HVAC Combined",
  B5_ELECTRICAL: "B5 - Electrical",
  B6_HYDRAULIC: "B6 - Hydraulic",
  C1_SOLAR_THERMAL: "C1 - Solar Thermal",
  C2_PV: "C2 - PV",
  C3_OTHER_RES: "C3 - Other RES",
  D1_FURNISHINGS: "D1 - Furnishings",
  E1_OUTDOOR: "E1 - Outdoor",
};

interface ConstructionBreakdownTableProps {
  constructionByCategory: Record<string, number>;
  totalMaterials: number;
  totalLabor: number;
  totalConstruction: number;
}

export function ConstructionBreakdownTable({
  constructionByCategory,
  totalConstruction,
}: ConstructionBreakdownTableProps) {
  const entries = Object.entries(constructionByCategory).filter(
    ([, cost]) => cost > 0
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Cost (EUR)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(([category, cost]) => (
          <TableRow key={category}>
            <TableCell>{CATEGORY_LABELS[category] ?? category}</TableCell>
            <TableCell className="text-right tabular-nums">
              {eurFormatter.format(cost)}
            </TableCell>
          </TableRow>
        ))}
        {entries.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center text-muted-foreground">
              No construction costs entered
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-bold">Total Construction</TableCell>
          <TableCell className="text-right font-bold tabular-nums">
            {eurFormatter.format(totalConstruction)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

type WLCBreakdownProps = Pick<
  LCCResult,
  | "designCosts"
  | "totalConstruction"
  | "operationAndMaintenance"
  | "buildingSiteManagement"
  | "nonConstructionCosts"
  | "lcc"
  | "wlc"
  | "residualValue"
  | "lccNetResidual"
  | "energyConsumed"
  | "energyProduced"
  | "maintenanceAtRefPeriod"
>;

interface WLCRow {
  label: string;
  value: number;
  bold?: boolean;
  negate?: boolean;
}

export function WLCBreakdownTable(props: WLCBreakdownProps) {
  const rows: WLCRow[] = [
    { label: "Design Costs", value: props.designCosts },
    { label: "Construction", value: props.totalConstruction },
    { label: "Energy (consumed)", value: props.energyConsumed },
    { label: "Energy (PV produced)", value: props.energyProduced, negate: true },
    { label: "Maintenance", value: props.maintenanceAtRefPeriod },
    { label: "O&M Total", value: props.operationAndMaintenance },
    { label: "Site Management", value: props.buildingSiteManagement },
    { label: "LCC", value: props.lcc, bold: true },
    { label: "Non-Construction", value: props.nonConstructionCosts },
    { label: "WLC", value: props.wlc, bold: true },
    { label: "Residual Value", value: props.residualValue, negate: true },
    { label: "LCC net Residual", value: props.lccNetResidual },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Component</TableHead>
          <TableHead className="text-right">Amount (EUR)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.label}
            className={row.bold ? "bg-muted/30" : undefined}
          >
            <TableCell className={row.bold ? "font-bold" : undefined}>
              {row.label}
            </TableCell>
            <TableCell
              className={`text-right tabular-nums ${row.bold ? "font-bold" : ""}`}
            >
              {row.negate ? "-" : ""}
              {eurFormatter.format(Math.abs(row.value))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

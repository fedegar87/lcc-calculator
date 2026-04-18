"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LCCResult } from "@/engine/types";
import { ChartDataTable } from "@/components/results/chart-data-table";
import { chartTheme, domainColor } from "@/lib/chart-theme";

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Line colors follow the frozen domain mapping (see docs/visual-identity.md).
const COLORS = {
  energy: domainColor("nrg"),
  maintenance: domainColor("mnt"),
  total: "#C8102E",
};

interface CostEvolutionLineProps {
  result: LCCResult;
}

export function CostEvolutionLine({ result }: CostEvolutionLineProps) {
  const length = result.heatingCosts.cumulated.length;

  const data = Array.from({ length }, (_, i) => {
    const energyCumulated =
      result.heatingCosts.cumulated[i] +
      result.coolingCosts.cumulated[i] +
      result.dhwCosts.cumulated[i] +
      result.householdCosts.cumulated[i] -
      result.pvProduction.cumulated[i];

    const maintenanceCumulated = result.maintenanceCumulated[i];

    return {
      year: i + 1,
      Energy: energyCumulated,
      Maintenance: maintenanceCumulated,
      "Total O&M": energyCumulated + maintenanceCumulated,
    };
  });

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ left: 20, right: 20, top: 5 }}>
          <CartesianGrid
            strokeDasharray={chartTheme.strokeDasharray}
            stroke={chartTheme.gridStroke}
          />
          <XAxis
            dataKey="year"
            label={{
              value: "Year",
              position: "insideBottomRight",
              offset: -5,
              fontSize: 11,
              fill: "#64748b",
            }}
            tick={chartTheme.axisTick}
            axisLine={chartTheme.axisLine}
          />
          <YAxis
            tickFormatter={(v: number) => eurFormatter.format(v)}
            tick={chartTheme.axisTick}
            axisLine={chartTheme.axisLine}
          />
          <Tooltip
            formatter={(value) => eurFormatter.format(Number(value ?? 0))}
            contentStyle={chartTheme.tooltipContentStyle}
            labelStyle={chartTheme.tooltipLabelStyle}
            itemStyle={chartTheme.tooltipItemStyle}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="Energy"
            stroke={COLORS.energy}
            dot={false}
            strokeWidth={2}
            isAnimationActive={!prefersReduced}
          />
          <Line
            type="monotone"
            dataKey="Maintenance"
            stroke={COLORS.maintenance}
            dot={false}
            strokeWidth={2}
            isAnimationActive={!prefersReduced}
          />
          <Line
            type="monotone"
            dataKey="Total O&M"
            stroke={COLORS.total}
            dot={false}
            strokeWidth={2.5}
            isAnimationActive={!prefersReduced}
          />
        </LineChart>
      </ResponsiveContainer>

      <ChartDataTable
        caption="Cost evolution data"
        columns={["Year", "Energy", "Maintenance", "Total O&M"]}
        rows={data.map((row) => ({
          Year: row.year,
          Energy: eurFormatter.format(row.Energy),
          Maintenance: eurFormatter.format(row.Maintenance),
          "Total O&M": eurFormatter.format(row["Total O&M"]),
        }))}
      />
    </div>
  );
}

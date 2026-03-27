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

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const COLORS = {
  energy: "oklch(0.62 0.14 250)",       // chart-1 blue
  maintenance: "oklch(0.70 0.14 80)",   // chart-3 amber
  total: "oklch(0.48 0.18 27.5)",       // chart-5 eurac red
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 20, right: 20, top: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          label={{ value: "Year", position: "insideBottomRight", offset: -5 }}
          fontSize={12}
        />
        <YAxis
          tickFormatter={(v: number) => eurFormatter.format(v)}
          fontSize={12}
        />
        <Tooltip
          formatter={(value) => eurFormatter.format(Number(value ?? 0))}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Legend />
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
  );
}

"use client";

import {
  BarChart,
  Bar,
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
  design: "oklch(0.62 0.14 250)",       // chart-1 blue
  construction: "oklch(0.65 0.15 155)",  // chart-2 green
  oAndM: "oklch(0.70 0.14 80)",         // chart-3 amber
  siteManagement: "oklch(0.60 0.14 300)", // chart-4 purple
};

interface LCCStackedBarProps {
  result: LCCResult;
}

export function LCCStackedBar({ result }: LCCStackedBarProps) {
  const data = [
    {
      name: "LCC",
      Design: result.designCosts,
      Construction: result.totalConstruction,
      "O&M": result.operationAndMaintenance,
      "Site Mgmt": result.buildingSiteManagement,
    },
  ];

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => eurFormatter.format(v)}
          fontSize={12}
        />
        <YAxis type="category" dataKey="name" width={40} fontSize={12} />
        <Tooltip
          formatter={(value) => eurFormatter.format(Number(value ?? 0))}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Legend />
        <Bar
          dataKey="Design"
          stackId="lcc"
          fill={COLORS.design}
          isAnimationActive={!prefersReduced}
        />
        <Bar
          dataKey="Construction"
          stackId="lcc"
          fill={COLORS.construction}
          isAnimationActive={!prefersReduced}
        />
        <Bar
          dataKey="O&M"
          stackId="lcc"
          fill={COLORS.oAndM}
          isAnimationActive={!prefersReduced}
        />
        <Bar
          dataKey="Site Mgmt"
          stackId="lcc"
          fill={COLORS.siteManagement}
          isAnimationActive={!prefersReduced}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
import { ChartDataTable } from "@/components/results/chart-data-table";
import { chartTheme, domainColor } from "@/lib/chart-theme";

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Each variant column is painted with a distinct domain tint so the
// comparison reads without cross-referencing the legend. Base = finance
// (baseline), Variant 1 = construction (intervention), Variant 2 =
// eurac-red (brand-emphasized alternative).
const VARIANT_COLORS = [
  domainColor("fin"),
  domainColor("construction"),
  "#C8102E",
];

interface VariantGroupedBarProps {
  variants: { label: string; result: LCCResult }[];
}

type CategoryKey = "Design" | "Construction" | "O&M" | "Site Mgmt" | "LCC" | "WLC";

const CATEGORIES: { key: CategoryKey; getter: (r: LCCResult) => number }[] = [
  { key: "Design", getter: (r) => r.designCosts },
  { key: "Construction", getter: (r) => r.totalConstruction },
  { key: "O&M", getter: (r) => r.operationAndMaintenance },
  { key: "Site Mgmt", getter: (r) => r.buildingSiteManagement },
  { key: "LCC", getter: (r) => r.lcc },
  { key: "WLC", getter: (r) => r.wlc },
];

export function VariantGroupedBar({ variants }: VariantGroupedBarProps) {
  if (variants.length === 0) return null;

  const data = CATEGORIES.map((cat) => {
    const row: Record<string, string | number> = { category: cat.key };
    for (const v of variants) {
      row[v.label] = cat.getter(v.result);
    }
    return row;
  });

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid
            strokeDasharray={chartTheme.strokeDasharray}
            stroke={chartTheme.gridStroke}
          />
          <XAxis
            dataKey="category"
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
          {variants.map((v, i) => (
            <Bar
              key={v.label}
              dataKey={v.label}
              fill={VARIANT_COLORS[i % VARIANT_COLORS.length]}
              barSize={chartTheme.barSize}
              isAnimationActive={!prefersReduced}
              radius={chartTheme.barRadius}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <ChartDataTable
        caption="Variant comparison data"
        columns={["Metric", ...variants.map((variant) => variant.label)]}
        rows={data.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key === "category" ? "Metric" : key,
              key === "category" ? value : eurFormatter.format(Number(value)),
            ])
          ) as Record<string, string | number>
        )}
      />
    </div>
  );
}

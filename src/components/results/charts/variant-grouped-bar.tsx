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

const VARIANT_COLORS = [
  "oklch(0.62 0.14 250)",   // chart-1 blue (Base)
  "oklch(0.70 0.14 80)",    // chart-3 amber (V1)
  "oklch(0.48 0.18 27.5)",  // chart-5 eurac red (V2)
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
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" fontSize={12} />
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
        {variants.map((v, i) => (
          <Bar
            key={v.label}
            dataKey={v.label}
            fill={VARIANT_COLORS[i % VARIANT_COLORS.length]}
            isAnimationActive={!prefersReduced}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

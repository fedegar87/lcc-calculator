"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BoxRow {
  output: string;
  label: string;
  min: number;
  max: number;
  p25: number;
  p75: number;
  median: number;
  whiskerLow: number;
  whiskerHigh: number;
}

interface SensitivityBoxPlotProps {
  rows: BoxRow[];
}

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Box plot of the LCC distribution sampled by EE — paper Fig. 5.
 *  Recharts has no native box-plot; we render the IQR as a thin Bar
 *  (p25 -> p75) with ErrorBar extending to the whiskers, and overlay
 *  a median tick using a second translucent Bar at [median, median]. */
export function SensitivityBoxPlot({ rows }: SensitivityBoxPlotProps) {
  if (rows.length === 0) return null;

  const enriched = rows.map((r) => ({
    ...r,
    iqrBase: r.p25,
    iqrHeight: r.p75 - r.p25,
    whiskers: [r.median - r.whiskerLow, r.whiskerHigh - r.median] as [
      number,
      number,
    ],
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, rows.length * 80)}>
      <BarChart
        layout="vertical"
        data={enriched}
        margin={{ top: 16, right: 32, bottom: 24, left: 96 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => eurFormatter.format(v)}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={92}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: unknown, name) => {
            const num = typeof value === "number" ? value : Number(value);
            return [eurFormatter.format(num), name];
          }}
        />
        <Bar
          dataKey="iqrHeight"
          stackId="iqr"
          fill="transparent"
          stroke="transparent"
          isAnimationActive={false}
          name="(offset)"
        />
        <Bar
          dataKey="median"
          fill="#3b82f6"
          fillOpacity={0.6}
          name="Median"
          isAnimationActive={false}
        >
          <ErrorBar
            dataKey="whiskers"
            width={6}
            strokeWidth={1.5}
            stroke="hsl(var(--foreground))"
            direction="x"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export type { BoxRow };

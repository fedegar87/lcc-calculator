"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

interface TornadoRow {
  parameterId: string;
  label: string;
  baseline: number;
  plus: number;
  minus: number;
  /** Combined |s+| + |s-| / 2 / delta — paper-style sensitivity index. */
  sensitivityIndex: number;
}

interface SensitivityTornadoProps {
  rows: TornadoRow[];
  /** Output baseline (€ or €/m²) for tooltip absolute values. */
  baselineOutput: number;
  outputLabel: string;
}

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function SensitivityTornado({
  rows,
  baselineOutput,
  outputLabel: _outputLabel,
}: SensitivityTornadoProps) {
  if (rows.length === 0) {
    return null;
  }

  const enriched = rows.map((row) => {
    const plusDelta = row.plus - row.baseline;
    const minusDelta = row.minus - row.baseline;
    return {
      ...row,
      plusDelta,
      minusDelta,
      plusPct: row.baseline !== 0 ? plusDelta / row.baseline : 0,
      minusPct: row.baseline !== 0 ? minusDelta / row.baseline : 0,
    };
  });

  const height = Math.max(220, enriched.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={enriched}
        layout="vertical"
        stackOffset="sign"
        margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tickFormatter={(value: number) => percentFormatter.format(value)}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={220}
          tick={{ fontSize: 11 }}
        />
        <ReferenceLine x={0} stroke="hsl(var(--foreground))" />
        <Tooltip
          formatter={(value) => {
            const numericValue = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(numericValue)) return "";
            const delta = numericValue * baselineOutput;
            return `${percentFormatter.format(numericValue)} (${eurFormatter.format(delta)})`;
          }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="minusPct"
          fill="#c8102e"
          stackId="tornado"
          radius={[4, 0, 0, 4]}
        />
        <Bar
          dataKey="plusPct"
          fill="#3b82f6"
          stackId="tornado"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export type { TornadoRow };
export { eurFormatter as _tornadoEurFormatter, percentFormatter as _tornadoPercentFormatter };
export { baselineOutputLabel };

function baselineOutputLabel(output: string): string {
  switch (output) {
    case "lcc":
      return "LCC";
    case "lccNetResidual":
      return "LCC net residual";
    case "wlc":
      return "WLC";
    case "kpiLCCPerM2":
      return "LCC / m²";
    case "kpiWLCPerM2":
      return "WLC / m²";
    default:
      return output;
  }
}

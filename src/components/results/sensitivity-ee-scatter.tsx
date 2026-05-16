"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EEScatterPoint {
  parameterId: string;
  label: string;
  muStar: number;
  sigma: number;
}

interface SensitivityEEScatterProps {
  points: EEScatterPoint[];
  /** When the literature scheme is used the axes can span an order of
   *  magnitude (paper Fig. 4 used log-log). */
  scale: "linear" | "log";
}

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function SensitivityEEScatter({
  points,
  scale,
}: SensitivityEEScatterProps) {
  if (points.length === 0) return null;

  const filtered = scale === "log"
    ? points.filter((p) => p.muStar > 0 && p.sigma > 0)
    : points;

  const maxMu = Math.max(1, ...filtered.map((p) => p.muStar));
  const maxSigma = Math.max(1, ...filtered.map((p) => p.sigma));
  const diagonalMax = Math.max(maxMu, maxSigma);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 20, right: 28, bottom: 36, left: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="muStar"
          name="μ*"
          scale={scale === "log" ? "log" : "linear"}
          domain={scale === "log" ? ["auto", "auto"] : [0, "auto"]}
          allowDataOverflow
          tickFormatter={(v: number) => eurFormatter.format(v)}
          tick={{ fontSize: 11 }}
          label={{
            value: "μ* — mean absolute LCC change per Morris step (€)",
            position: "bottom",
            offset: 8,
            style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
          }}
        />
        <YAxis
          type="number"
          dataKey="sigma"
          name="σ"
          scale={scale === "log" ? "log" : "linear"}
          domain={scale === "log" ? ["auto", "auto"] : [0, "auto"]}
          allowDataOverflow
          tickFormatter={(v: number) => eurFormatter.format(v)}
          tick={{ fontSize: 11 }}
          label={{
            value: "σ (€)",
            angle: -90,
            position: "left",
            offset: 12,
            style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
          }}
        />
        <ReferenceLine
          segment={[
            { x: scale === "log" ? 1 : 0, y: scale === "log" ? 1 : 0 },
            { x: diagonalMax, y: diagonalMax },
          ]}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 4"
          ifOverflow="hidden"
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
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
          labelFormatter={(_label, payload) => {
            const pt = payload?.[0]?.payload as EEScatterPoint | undefined;
            return pt?.label ?? "";
          }}
        />
        <Scatter data={filtered} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export type { EEScatterPoint };

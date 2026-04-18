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

// Bar colors follow the frozen domain mapping (see docs/visual-identity.md).
const COLORS = {
  design: domainColor("fin"),
  construction: domainColor("construction"),
  oAndM: domainColor("nrg"),
  siteManagement: domainColor("res"),
};

interface LCCStackedBarProps {
  result: LCCResult;
  showTable?: boolean;
}

export function LCCStackedBar({
  result,
  showTable = true,
}: LCCStackedBarProps) {
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
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid
            strokeDasharray={chartTheme.strokeDasharray}
            stroke={chartTheme.gridStroke}
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => eurFormatter.format(v)}
            tick={chartTheme.axisTick}
            axisLine={chartTheme.axisLine}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={40}
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
          <Bar
            dataKey="Design"
            stackId="lcc"
            fill={COLORS.design}
            barSize={chartTheme.barSize}
            isAnimationActive={!prefersReduced}
          />
          <Bar
            dataKey="Construction"
            stackId="lcc"
            fill={COLORS.construction}
            barSize={chartTheme.barSize}
            isAnimationActive={!prefersReduced}
          />
          <Bar
            dataKey="O&M"
            stackId="lcc"
            fill={COLORS.oAndM}
            barSize={chartTheme.barSize}
            isAnimationActive={!prefersReduced}
          />
          <Bar
            dataKey="Site Mgmt"
            stackId="lcc"
            fill={COLORS.siteManagement}
            barSize={chartTheme.barSize}
            isAnimationActive={!prefersReduced}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {showTable ? (
        <ChartDataTable
          caption="LCC breakdown data"
          columns={["Metric", "Amount"]}
          rows={[
            { Metric: "Design", Amount: eurFormatter.format(result.designCosts) },
            {
              Metric: "Construction",
              Amount: eurFormatter.format(result.totalConstruction),
            },
            {
              Metric: "O&M",
              Amount: eurFormatter.format(result.operationAndMaintenance),
            },
            {
              Metric: "Site management",
              Amount: eurFormatter.format(result.buildingSiteManagement),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

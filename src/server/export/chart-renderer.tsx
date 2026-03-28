import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import type { LCCResult } from "@/engine/types";

// Hex colors for SVG rendering (sharp's librsvg may not support oklch)
const BAR_COLORS = {
  design: "#5B8DEF",
  construction: "#4CAF80",
  oAndM: "#D4A843",
  siteManagement: "#9B6FCC",
};

const LINE_COLORS = {
  energy: "#5B8DEF",
  maintenance: "#D4A843",
  total: "#C8102E",
};

async function svgToPng(svgString: string): Promise<Buffer> {
  return sharp(Buffer.from(svgString)).png().toBuffer();
}

export async function renderLCCStackedBarPng(
  result: LCCResult,
): Promise<Buffer> {
  const data = [
    {
      name: "LCC",
      Design: result.designCosts,
      Construction: result.totalConstruction,
      "O&M": result.operationAndMaintenance,
      "Site Mgmt": result.buildingSiteManagement,
    },
  ];

  const svg = renderToStaticMarkup(
    <BarChart
      width={500}
      height={280}
      data={data}
      layout="vertical"
      margin={{ left: 20, right: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" fontSize={12} />
      <YAxis type="category" dataKey="name" width={40} fontSize={12} />
      <Legend />
      <Bar
        dataKey="Design"
        stackId="lcc"
        fill={BAR_COLORS.design}
        isAnimationActive={false}
      />
      <Bar
        dataKey="Construction"
        stackId="lcc"
        fill={BAR_COLORS.construction}
        isAnimationActive={false}
      />
      <Bar
        dataKey="O&M"
        stackId="lcc"
        fill={BAR_COLORS.oAndM}
        isAnimationActive={false}
      />
      <Bar
        dataKey="Site Mgmt"
        stackId="lcc"
        fill={BAR_COLORS.siteManagement}
        isAnimationActive={false}
      />
    </BarChart>,
  );

  return svgToPng(svg);
}

export async function renderCostEvolutionPng(
  result: LCCResult,
): Promise<Buffer> {
  const length = result.heatingCosts.cumulated.length;

  const data = Array.from({ length }, (_, i) => {
    const energyCumulated =
      result.heatingCosts.cumulated[i] +
      result.coolingCosts.cumulated[i] +
      result.dhwCosts.cumulated[i] +
      result.householdCosts.cumulated[i] -
      result.pvProduction.cumulated[i];

    return {
      year: i + 1,
      Energy: energyCumulated,
      Maintenance: result.maintenanceCumulated[i],
      "Total O&M": energyCumulated + result.maintenanceCumulated[i],
    };
  });

  const svg = renderToStaticMarkup(
    <LineChart
      width={500}
      height={280}
      data={data}
      margin={{ left: 20, right: 20, top: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" fontSize={12} />
      <YAxis fontSize={12} />
      <Legend />
      <Line
        type="monotone"
        dataKey="Energy"
        stroke={LINE_COLORS.energy}
        dot={false}
        strokeWidth={2}
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="Maintenance"
        stroke={LINE_COLORS.maintenance}
        dot={false}
        strokeWidth={2}
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="Total O&M"
        stroke={LINE_COLORS.total}
        dot={false}
        strokeWidth={2.5}
        isAnimationActive={false}
      />
    </LineChart>,
  );

  return svgToPng(svg);
}

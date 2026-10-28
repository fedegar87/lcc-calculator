"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { UNITS } from "@/lib/units";

const HELP_SECTIONS = [
  {
    title: "1. Project & Geometry",
    items: [
      {
        label: "Treated Floor Area (TFA)",
        copy:
          "Primary reference area (m²) used to calculate all specific costs (€/m²) and energy indicators (kWh/m²y), just like the Heated net floor area / TFA in the CRAVEzero Excel tool.",
      },
      {
        label: "GFA & NFA",
        copy:
          "Gross Floor Area (external envelope) and Net Floor Area (usable internal area). You can copy NFA into TFA with one click if they coincide.",
      },
      {
        label: "Optional Envelope & Income Sections",
        copy:
          "PHPP envelope indicators (U-values, n50), unheated areas, and rental income are grouped inside optional collapsible drawers so they stay out of your way unless needed.",
      },
    ],
  },
  {
    title: "2. Energy & Economy",
    items: [
      {
        label: "Economic Boundary Conditions",
        copy:
          "Set the Reference study period (e.g. 40 years), Nominal interest rate, and Inflation rate. The app automatically derives the Real discount rate: (1 + nominal) / (1 + inflation) - 1.",
      },
      {
        label: "Energy Consumption & PV",
        copy: `Enter annual demand (${UNITS.kWh_m2_y}) for Heating, Cooling, Ventilation, DHW, Lighting, and Appliances, plus on-site PV production (${UNITS.kWh_y} or ${UNITS.kWh_m2_y}). Total kWh/y and Year 1 EUR/y are calculated live.`,
      },
      {
        label: "Energy Vector Prices",
        copy: `Unit tariffs (€/kWh) and annual price escalation (%) are shown right below your energy demand table, highlighting the carriers actively used by your building.`,
      },
    ],
  },
  {
    title: "3. Costs & Maintenance",
    items: [
      {
        label: "Direct Spreadsheet Cost Entry (A1–E1)",
        copy:
          "Enter Materials (€) and Labor (€) directly on each category row—just like the summary table in the original CRAVEzero Excel workbook. Total (€) and €/m² update immediately.",
      },
      {
        label: "Optional Detail Layers",
        copy:
          "Click 'Layers' on any construction row if you want to break a category down into individual stratigraphic layers with Area (m²) × Unit Price (€/m²).",
      },
      {
        label: "Maintenance (Group A + EN 15459) & WLC",
        copy:
          "Set the annual maintenance % for Group A building elements, configure EN 15459 service component lifespans/maintenance rates, and optionally include Land & Non-Construction costs (WLC).",
      },
    ],
  },
  {
    title: "4. Results & Scenarios",
    items: [
      {
        label: "KPIs & EUR / EUR/m² Tables",
        copy:
          "View Life-Cycle Cost (LCC), Whole-Life Cost (WLC), Investment Cost, and Operation & Maintenance (O&M) both in total EUR and specific EUR/m², alongside stacked and cumulative cash-flow charts.",
      },
      {
        label: "Scenario Comparison (Base vs Variants)",
        copy:
          "Use the scenario pills at the top of the workspace to switch between Base Case and design variants, or clone the active variant in one click to test alternative solutions.",
      },
      {
        label: "Excel / PDF Export & Advanced Tools",
        copy:
          "Export a CRAVEzero-structured Excel workbook (.xlsx) or print a PDF report directly. Academic tools (Formula Audit, Sensitivity Analysis, Engine mode) are tucked inside the Advanced menu.",
      },
    ],
  },
] as const;

export default function HelpCenterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Manual & Quick Guide</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The workspace follows the 4-tab structure of the original CRAVEzero /
          Skanska LCC Excel workbook so you can move naturally from geometry and
          energy inputs to construction costs and life-cycle results.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {HELP_SECTIONS.map((section) => (
          <GlassCard key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border bg-muted/20 p-4"
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

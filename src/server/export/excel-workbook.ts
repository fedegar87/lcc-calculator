import ExcelJS from "exceljs";
import type { LCCResult } from "@/engine/types";

const CATEGORY_LABELS: Record<string, string> = {
  A1_ROOFS: "A1 - Roofs",
  A2_FACADES: "A2 - Facades",
  A3_FLOORS: "A3 - Floors",
  A4_WALLS: "A4 - Walls",
  A5_WINDOWS: "A5 - Windows",
  A6_SHADING: "A6 - Shading",
  A7_DOORS: "A7 - Doors",
  A8_INTERNAL: "A8 - Internal",
  A9_STRUCTURE: "A9 - Structure",
  A10_OTHER: "A10 - Other",
  B1_HEATING: "B1 - Heating",
  B2_COOLING: "B2 - Cooling",
  B3_VENTILATION: "B3 - Ventilation",
  B4_HVAC_COMBINED: "B4 - HVAC Combined",
  B5_ELECTRICAL: "B5 - Electrical",
  B6_HYDRAULIC: "B6 - Hydraulic",
  C1_SOLAR_THERMAL: "C1 - Solar Thermal",
  C2_PV: "C2 - PV",
  C3_OTHER_RES: "C3 - Other RES",
  D1_FURNISHINGS: "D1 - Furnishings",
  E1_OUTDOOR: "E1 - Outdoor",
};

const EUR_FORMAT = '\u20AC#,##0.00';

const EURAC_RED: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFC8102E" },
};

const WHITE_BOLD: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

function addHeaderRow(ws: ExcelJS.Worksheet, values: string[]) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.fill = EURAC_RED;
    cell.font = WHITE_BOLD;
  });
  return row;
}

export async function buildExcelWorkbook(
  result: LCCResult,
  project: { name: string; city: string | null },
  variant: { label: string },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "LCCzero";
  wb.created = new Date();

  // ---- Sheet 1: Summary ----
  const wsSummary = wb.addWorksheet("Summary");
  wsSummary.columns = [
    { width: 30 },
    { width: 20 },
  ];
  addHeaderRow(wsSummary, ["Summary", ""]);
  wsSummary.addRow(["Project", project.name]);
  if (project.city) wsSummary.addRow(["City", project.city]);
  wsSummary.addRow(["Variant", variant.label]);
  wsSummary.addRow(["Date", new Date().toISOString().slice(0, 10)]);
  wsSummary.addRow(["Engine Version", result.engineVersion]);
  wsSummary.addRow(["Formula Mode", result.formulaMode]);
  wsSummary.addRow([]);
  addHeaderRow(wsSummary, ["KPI", "Value"]);

  const kpis: [string, number | null][] = [
    ["LCC", result.lcc],
    ["WLC", result.wlc],
    ["LCC / m\u00B2", result.kpiLCCPerM2],
    ["WLC / m\u00B2", result.kpiWLCPerM2],
    ["Residual Value", result.residualValue],
    ["LCC net Residual", result.lccNetResidual],
  ];
  if (result.income) {
    kpis.push(["Simple Payback (years)", result.income.simplePaybackYears]);
  }
  for (const [label, value] of kpis) {
    const row = wsSummary.addRow([label, value ?? "N/A"]);
    if (typeof value === "number") {
      row.getCell(2).numFmt = label.includes("Payback") ? "#,##0.0" : EUR_FORMAT;
    }
  }

  // ---- Sheet 2: Construction ----
  const wsConstruction = wb.addWorksheet("Construction");
  wsConstruction.columns = [
    { width: 25 },
    { width: 18 },
  ];
  addHeaderRow(wsConstruction, ["Category", "Cost (EUR)"]);

  const nonZero = Object.entries(result.constructionByCategory).filter(
    ([, cost]) => cost > 0,
  );
  for (const [cat, cost] of nonZero) {
    const row = wsConstruction.addRow([CATEGORY_LABELS[cat] ?? cat, cost]);
    row.getCell(2).numFmt = EUR_FORMAT;
  }
  const totalRow = wsConstruction.addRow(["Total", result.totalConstruction]);
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(2).font = { bold: true };
  totalRow.getCell(2).numFmt = EUR_FORMAT;

  // ---- Sheet 3: Energy ----
  const wsEnergy = wb.addWorksheet("Energy");
  wsEnergy.columns = [
    { width: 8 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];
  addHeaderRow(wsEnergy, [
    "Year",
    "Heating",
    "Cooling",
    "DHW",
    "Household",
    "PV Production",
    "Net Energy",
  ]);

  const years = result.heatingCosts.cumulated.length;
  for (let i = 0; i < years; i++) {
    const heating = result.heatingCosts.cumulated[i];
    const cooling = result.coolingCosts.cumulated[i];
    const dhw = result.dhwCosts.cumulated[i];
    const household = result.householdCosts.cumulated[i];
    const pv = result.pvProduction.cumulated[i];
    const net = heating + cooling + dhw + household - pv;

    const row = wsEnergy.addRow([
      i + 1,
      heating,
      cooling,
      dhw,
      household,
      pv,
      net,
    ]);
    for (let c = 2; c <= 7; c++) {
      row.getCell(c).numFmt = EUR_FORMAT;
    }
  }

  // ---- Sheet 4: Maintenance ----
  const wsMaintenance = wb.addWorksheet("Maintenance");
  wsMaintenance.columns = [
    { width: 8 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];
  addHeaderRow(wsMaintenance, [
    "Year",
    "Elements",
    "Services",
    "Total",
    "Cumulated",
  ]);

  for (let i = 0; i < years; i++) {
    const row = wsMaintenance.addRow([
      i + 1,
      result.maintenanceElements[i],
      result.maintenanceServices[i],
      result.maintenanceTotal[i],
      result.maintenanceCumulated[i],
    ]);
    for (let c = 2; c <= 5; c++) {
      row.getCell(c).numFmt = EUR_FORMAT;
    }
  }

  // ---- Sheet 5: WLC-LCC ----
  const wsWlcLcc = wb.addWorksheet("WLC-LCC");
  wsWlcLcc.columns = [
    { width: 30 },
    { width: 20 },
  ];
  addHeaderRow(wsWlcLcc, ["Component", "Amount (EUR)"]);

  const breakdown: [string, number][] = [
    ["Design Costs", result.designCosts],
    ["Construction", result.totalConstruction],
    ["Energy Consumed", result.energyConsumed],
    ["Energy Produced (PV)", result.energyProduced],
    ["Maintenance", result.maintenanceAtRefPeriod],
    ["Operation & Maintenance", result.operationAndMaintenance],
    ["Site Management", result.buildingSiteManagement],
    ["LCC", result.lcc],
    ["Non-Construction Costs", result.nonConstructionCosts],
    ["WLC", result.wlc],
    ["Residual Value", result.residualValue],
    ["LCC net Residual", result.lccNetResidual],
  ];

  for (const [label, value] of breakdown) {
    const row = wsWlcLcc.addRow([label, value]);
    row.getCell(2).numFmt = EUR_FORMAT;
    if (label === "LCC" || label === "WLC") {
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { bold: true };
    }
  }

  if (result.income) {
    wsWlcLcc.addRow([]);
    addHeaderRow(wsWlcLcc, ["Income Analysis", ""]);
    const incomeRows: [string, number | string][] = [
      ["Net Annual Income", result.income.netAnnualIncome],
      [
        "Simple Payback (years)",
        result.income.simplePaybackYears ?? "Never",
      ],
      ["NPV Income Stream", result.income.npvIncomeStream],
      ["Net Present Value", result.income.netPresentValue],
    ];
    for (const [label, value] of incomeRows) {
      const row = wsWlcLcc.addRow([label, value]);
      if (typeof value === "number") {
        row.getCell(2).numFmt = label.includes("Payback")
          ? "#,##0.0"
          : EUR_FORMAT;
      }
    }
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

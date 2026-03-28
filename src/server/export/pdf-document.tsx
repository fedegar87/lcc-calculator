import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import type { LCCResult } from "@/engine/types";
import { styles } from "./pdf-styles";

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

const eurFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const pctFmt = (v: number | null) =>
  v != null ? `${(v * 100).toFixed(1)}%` : "N/A";

interface LCCReportProps {
  project: { name: string; city: string | null };
  variant: { label: string };
  result: LCCResult;
  chartImages: { stackedBar: Buffer; costEvolution: Buffer };
  generatedAt: string;
}

export function LCCReport({
  project,
  variant,
  result,
  chartImages,
  generatedAt,
}: LCCReportProps) {
  const nonZeroCategories = Object.entries(result.constructionByCategory).filter(
    ([, cost]) => cost > 0,
  );

  const footerText = `LCCzero | Engine ${result.engineVersion} | ${result.formulaMode} | ${generatedAt}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover/Header */}
        <View style={styles.header}>
          <Text style={styles.subText}>EURAC Research</Text>
          <Text style={styles.headerText}>{project.name}</Text>
          {project.city && <Text style={styles.subText}>{project.city}</Text>}
          <Text style={styles.subText}>{generatedAt}</Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          LCCzero - Life Cycle Cost Analysis
        </Text>

        {/* Project Info Summary */}
        <Text style={styles.sectionTitle}>Project Information</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Variant</Text>
            <Text style={styles.tableCellRight}>{variant.label}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Reference Period</Text>
            <Text style={styles.tableCellRight}>
              {result.heatingCosts.cumulated.length} years
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Treated Floor Area</Text>
            <Text style={styles.tableCellRight}>
              {result.kpiLCCPerM2 != null && result.lcc !== 0
                ? `${Math.round(result.lcc / result.kpiLCCPerM2)} m\u00B2`
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Boundary Conditions */}
        <Text style={styles.sectionTitle}>Boundary Conditions</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Real Interest Rate</Text>
            <Text style={styles.tableCellRight}>
              {(result.realInterestRate * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Formula Mode</Text>
            <Text style={styles.tableCellRight}>{result.formulaMode}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Engine Version</Text>
            <Text style={styles.tableCellRight}>{result.engineVersion}</Text>
          </View>
        </View>

        {/* Construction Categories */}
        <Text style={styles.sectionTitle}>Construction Cost Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellBold}>Category</Text>
            <Text style={{ ...styles.tableCellBold, textAlign: "right" }}>
              Cost (EUR)
            </Text>
          </View>
          {nonZeroCategories.map(([cat, cost]) => (
            <View key={cat} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {CATEGORY_LABELS[cat] ?? cat}
              </Text>
              <Text style={styles.tableCellRight}>{eurFmt.format(cost)}</Text>
            </View>
          ))}
          <View
            style={{
              ...styles.tableRow,
              borderTopWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={styles.tableCellBold}>Total Construction</Text>
            <Text style={{ ...styles.tableCellBold, textAlign: "right" }}>
              {eurFmt.format(result.totalConstruction)}
            </Text>
          </View>
        </View>

        {/* WLC/LCC Breakdown */}
        <Text style={styles.sectionTitle}>WLC / LCC Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellBold}>Component</Text>
            <Text style={{ ...styles.tableCellBold, textAlign: "right" }}>
              Amount (EUR)
            </Text>
          </View>
          {[
            ["Design Costs", result.designCosts],
            ["Construction", result.totalConstruction],
            ["Energy Consumed", result.energyConsumed],
            ["Energy PV Production", -result.energyProduced],
            ["Maintenance", result.maintenanceAtRefPeriod],
            ["Operation & Maintenance", result.operationAndMaintenance],
            ["Site Management", result.buildingSiteManagement],
            ["LCC", result.lcc],
            ["Non-Construction Costs", result.nonConstructionCosts],
            ["WLC", result.wlc],
            ["Residual Value", result.residualValue],
            ["LCC net Residual", result.lccNetResidual],
          ].map(([label, value]) => (
            <View
              key={label as string}
              style={
                label === "LCC" || label === "WLC"
                  ? {
                      ...styles.tableRow,
                      backgroundColor: "#f5f5f5",
                    }
                  : styles.tableRow
              }
            >
              <Text
                style={
                  label === "LCC" || label === "WLC"
                    ? styles.tableCellBold
                    : styles.tableCell
                }
              >
                {label as string}
              </Text>
              <Text
                style={
                  label === "LCC" || label === "WLC"
                    ? { ...styles.tableCellBold, textAlign: "right" }
                    : styles.tableCellRight
                }
              >
                {eurFmt.format(value as number)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{footerText}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Page 2: KPIs + Charts */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>LCC Total</Text>
          <Text style={styles.kpiValue}>{eurFmt.format(result.lcc)}</Text>
        </View>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>WLC Total</Text>
          <Text style={styles.kpiValue}>{eurFmt.format(result.wlc)}</Text>
        </View>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>LCC / m2</Text>
          <Text style={styles.kpiValue}>
            {result.kpiLCCPerM2 != null
              ? eurFmt.format(result.kpiLCCPerM2)
              : "N/A"}
          </Text>
        </View>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>Design / LCC</Text>
          <Text style={styles.kpiValue}>
            {pctFmt(result.kpiDesignOverLCC)}
          </Text>
        </View>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>Construction / LCC</Text>
          <Text style={styles.kpiValue}>
            {pctFmt(result.kpiConstructionOverLCC)}
          </Text>
        </View>
        <View style={styles.kpiRow}>
          <Text style={styles.kpiLabel}>O&M / LCC</Text>
          <Text style={styles.kpiValue}>{pctFmt(result.kpiOMOverLCC)}</Text>
        </View>
        {result.income && (
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Simple Payback</Text>
            <Text style={styles.kpiValue}>
              {result.income.simplePaybackYears != null
                ? `${result.income.simplePaybackYears.toFixed(1)} years`
                : "Never"}
            </Text>
          </View>
        )}

        {/* Charts */}
        <Text style={styles.sectionTitle}>LCC Cost Breakdown</Text>
        <Image
          style={styles.chartImage}
          src={chartImages.stackedBar}
        />

        <Text style={styles.sectionTitle}>Cost Evolution Over Time</Text>
        <Image
          style={styles.chartImage}
          src={chartImages.costEvolution}
        />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{footerText}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

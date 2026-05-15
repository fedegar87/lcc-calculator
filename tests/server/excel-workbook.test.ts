import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { calculateLCC } from "@/engine";
import { buildExcelWorkbook } from "@/server/export/excel-workbook";
import { BUGFIXED_CONFIG, baseInput } from "../engine/helpers";

describe("Excel workbook export", () => {
  it("writes one row per analysis year for energy and maintenance", async () => {
    const result = calculateLCC(baseInput(), BUGFIXED_CONFIG);
    const buffer = await buildExcelWorkbook(
      result,
      { name: "Fixture", city: null },
      { label: "BASE" },
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const energy = workbook.getWorksheet("Energy");
    const maintenance = workbook.getWorksheet("Maintenance");

    expect(energy).toBeDefined();
    expect(maintenance).toBeDefined();
    expect(energy!.rowCount).toBe(41);
    expect(maintenance!.rowCount).toBe(41);
    expect(energy!.getRow(2).getCell(1).value).toBe(1);
    expect(maintenance!.getRow(2).getCell(1).value).toBe(1);
    expect(energy!.getRow(41).getCell(1).value).toBe(40);
    expect(maintenance!.getRow(41).getCell(1).value).toBe(40);
  });
});

import { describe, expect, it } from "vitest";
import { UNITS } from "@/lib/units";

describe("UNITS", () => {
  it("uses scientific Unicode notation for display units", () => {
    expect(UNITS.m2).toBe("m²");
    expect(UNITS.m3).toBe("m³");
    expect(UNITS.uvalue).toBe("W/(m²·K)");
    expect(UNITS.kgCO2).toBe("kgCO₂");
  });
});

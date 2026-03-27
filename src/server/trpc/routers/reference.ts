import { createTRPCRouter, baseProcedure } from "../init";
import { EN15459_COMPONENTS, ENERGY_SOURCES } from "@/engine/constants";

const COST_CATEGORIES = [
  // Building Elements (A)
  { value: "A1_ROOFS", label: "A1 - Roofs", group: "Building Elements" },
  { value: "A2_FACADES", label: "A2 - Facades", group: "Building Elements" },
  { value: "A3_FLOORS", label: "A3 - Floors", group: "Building Elements" },
  { value: "A4_WALLS", label: "A4 - Walls", group: "Building Elements" },
  { value: "A5_WINDOWS", label: "A5 - Windows", group: "Building Elements" },
  { value: "A6_SHADING", label: "A6 - Shading", group: "Building Elements" },
  { value: "A7_DOORS", label: "A7 - Doors", group: "Building Elements" },
  { value: "A8_INTERNAL", label: "A8 - Internal", group: "Building Elements" },
  { value: "A9_STRUCTURE", label: "A9 - Structure", group: "Building Elements" },
  { value: "A10_OTHER", label: "A10 - Other", group: "Building Elements" },
  // Building Services (B)
  { value: "B1_HEATING", label: "B1 - Heating", group: "Building Services" },
  { value: "B2_COOLING", label: "B2 - Cooling", group: "Building Services" },
  { value: "B3_VENTILATION", label: "B3 - Ventilation", group: "Building Services" },
  { value: "B4_HVAC_COMBINED", label: "B4 - HVAC Combined", group: "Building Services" },
  { value: "B5_ELECTRICAL", label: "B5 - Electrical", group: "Building Services" },
  { value: "B6_HYDRAULIC", label: "B6 - Hydraulic", group: "Building Services" },
  // Renewable Energy (C)
  { value: "C1_SOLAR_THERMAL", label: "C1 - Solar Thermal", group: "Renewable Energy" },
  { value: "C2_PV", label: "C2 - PV", group: "Renewable Energy" },
  { value: "C3_OTHER_RES", label: "C3 - Other RES", group: "Renewable Energy" },
  // Furnishings (D)
  { value: "D1_FURNISHINGS", label: "D1 - Furnishings", group: "Furnishings" },
  // Outdoor (E)
  { value: "E1_OUTDOOR", label: "E1 - Outdoor", group: "Outdoor" },
] as const;

export const referenceRouter = createTRPCRouter({
  en15459Components: baseProcedure.query(() => {
    return EN15459_COMPONENTS;
  }),

  energySources: baseProcedure.query(() => {
    return ENERGY_SOURCES;
  }),

  costCategories: baseProcedure.query(() => {
    return COST_CATEGORIES;
  }),
});

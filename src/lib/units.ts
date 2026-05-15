export const UNITS = {
  m2: "m²",
  m3: "m³",
  m2K: "m²·K",
  uvalue: "W/(m²·K)",
  kgCO2: "kgCO₂",
  kgCO2_m2: "kgCO₂/m²",
  EUR_m2: "€/m²",
  EUR_m3: "€/m³",
  kWh_m2_y: "kWh/(m²·y)",
  kWh_y: "kWh/y",
} as const;

export const UNIT_LABELS = {
  m2: "square meters",
  m3: "cubic meters",
  uvalue: "watts per square meter kelvin",
  EUR_m2: "euros per square meter",
  kWh_m2_y: "kilowatt-hours per square meter per year",
  kWh_y: "kilowatt-hours per year",
} as const;

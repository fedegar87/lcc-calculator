export const DEFAULT_METHOD_PROFILE = "CRAVEZERO_LEGACY" as const;

export type MethodProfileId =
  | "CRAVEZERO_LEGACY"
  | "EPBD_2025_DRAFT"
  | "LEVELS_50Y_DRAFT"
  | "CUSTOM";

export interface MethodProfileDefaults {
  referencePeriod: number;
  interestRate: number;
  inflationRate: number;
  label: string;
  status: "implemented" | "metadata_only";
  note: string;
}

const METHOD_DEFAULTS: Record<MethodProfileId, MethodProfileDefaults> = {
  CRAVEZERO_LEGACY: {
    referencePeriod: 40,
    interestRate: 0.0151,
    inflationRate: 0.0056,
    label: "CRAVEzero legacy",
    status: "implemented",
    note: "Current deterministic CRAVEzero-derived calculation profile.",
  },
  EPBD_2025_DRAFT: {
    referencePeriod: 30,
    interestRate: 0.03,
    inflationRate: 0,
    label: "EPBD 2025 draft",
    status: "metadata_only",
    note: "Placeholder pending a calculation note based on Delegated Regulation (EU) 2025/2273.",
  },
  LEVELS_50Y_DRAFT: {
    referencePeriod: 50,
    interestRate: 0.03,
    inflationRate: 0,
    label: "Level(s) 50-year draft",
    status: "metadata_only",
    note: "Placeholder for Level(s) indicator 6.1 style reporting.",
  },
  CUSTOM: {
    referencePeriod: 40,
    interestRate: 0.0151,
    inflationRate: 0.0056,
    label: "Custom",
    status: "metadata_only",
    note: "User-defined boundary conditions.",
  },
};

export function getMethodDefaults(
  profile: MethodProfileId = DEFAULT_METHOD_PROFILE,
): MethodProfileDefaults {
  return METHOD_DEFAULTS[profile];
}

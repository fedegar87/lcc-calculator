export type ProjectStepId =
  | "overview"
  | "info"
  | "wlc"
  | "construction"
  | "energy"
  | "results";

export type VariantReadinessStatus =
  | "empty"
  | "draft"
  | "preview_ready"
  | "analysis_ready"
  | "publish_ready";

export type ValidationSeverity = "blocker" | "warning" | "info";

export interface ProjectReadinessSection {
  id: Exclude<ProjectStepId, "overview">;
  label: string;
  requiredFilled: number;
  requiredTotal: number;
  recommendedFilled: number;
  recommendedTotal: number;
  warnings: number;
  blockers: number;
  isPreviewReady: boolean;
}

export interface ValidationIssue {
  id: string;
  section: Exclude<ProjectStepId, "overview" | "results">;
  severity: ValidationSeverity;
  title: string;
  description: string;
}

export interface ProjectReadiness {
  status: VariantReadinessStatus;
  statusLabel: string;
  sections: ProjectReadinessSection[];
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  requiredFilled: number;
  requiredTotal: number;
  recommendedFilled: number;
  recommendedTotal: number;
  previewReady: boolean;
  analysisReady: boolean;
  publishReady: boolean;
}

type BuildingUse =
  | "RESIDENTIAL_SINGLE"
  | "RESIDENTIAL_MULTI"
  | "OFFICE"
  | "EDUCATION"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "OTHER";

interface ProjectLike {
  name?: string | null;
  country?: string | null;
  city?: string | null;
  buildingUse?: string | null;
}

interface GeometryLike {
  grossFloorArea?: unknown;
  netFloorArea?: unknown;
  treatedFloorArea?: unknown;
  grossVolume?: unknown;
  windowArea?: unknown;
  totalThermalEnvelope?: unknown;
  avgUvalueOpaque?: unknown;
  airTightness?: unknown;
  pvInstalledCapacity?: unknown;
}

interface BoundaryConditionLike {
  stakeholderRole?: unknown;
  referencePeriod?: unknown;
  interestRate?: unknown;
  inflationRate?: unknown;
  energyPrices?: Array<{
    index: number;
    pricePerKwh?: unknown;
    annualIncrease?: unknown;
  }> | unknown;
}

interface EnergyInputLike {
  endUse: string;
  energySourceIndex: number;
  specificConsumption?: unknown;
  pvProductionKwh?: unknown;
}

interface DetailLike {
  area?: unknown;
  materialCost?: unknown;
  unitPrice?: unknown;
  laborCost?: unknown;
  otherCost?: unknown;
}

interface CostItemLike {
  category: string;
  materialCostAgg?: unknown;
  laborCostAgg?: unknown;
  otherCostAgg?: unknown;
  details?: DetailLike[];
}

interface DesignCostLike {
  preliminaryCost?: unknown;
  definitiveCost?: unknown;
  executiveCost?: unknown;
  siteManagementCost?: unknown;
}

interface IncomeLike {
  rent1MonthlyPerM2?: unknown;
  rent1Area?: unknown;
  rent2MonthlyPerM2?: unknown;
  rent2Area?: unknown;
  rent3MonthlyPerM2?: unknown;
  rent3Area?: unknown;
  otherIncome1?: unknown;
  otherIncome2?: unknown;
  otherIncome3?: unknown;
}

interface MaintenanceConfigLike {
  buildingElementMaintenancePercent?: unknown;
}

interface ServiceComponentLike {
  en15459ComponentIndex?: unknown;
}

interface WLCInputLike {
  landArea?: unknown;
  landPrice?: unknown;
}

export interface VariantLike {
  label?: string | null;
  geometry?: GeometryLike | null;
  boundaryCondition?: BoundaryConditionLike | null;
  energyInputs?: EnergyInputLike[];
  costItems?: CostItemLike[];
  designCosts?: DesignCostLike[];
  incomeInput?: IncomeLike | null;
  maintenanceConfig?: MaintenanceConfigLike | null;
  serviceComponents?: ServiceComponentLike[];
  wlcInput?: WLCInputLike | null;
}

const DHW_REQUIRED_USES = new Set<BuildingUse>([
  "RESIDENTIAL_SINGLE",
  "RESIDENTIAL_MULTI",
  "EDUCATION",
]);

const CATEGORY_GROUPS = {
  A: [
    "A1_ROOFS",
    "A2_FACADES",
    "A3_FLOORS",
    "A4_WALLS",
    "A5_WINDOWS",
    "A6_SHADING",
    "A7_DOORS",
    "A8_INTERNAL",
    "A9_STRUCTURE",
    "A10_OTHER",
  ],
  B: [
    "B1_HEATING",
    "B2_COOLING",
    "B3_VENTILATION",
    "B4_HVAC_COMBINED",
    "B5_ELECTRICAL",
    "B6_HYDRAULIC",
  ],
  C: ["C1_SOLAR_THERMAL", "C2_PV", "C3_OTHER_RES"],
  D: ["D1_FURNISHINGS"],
  E: ["E1_OUTDOOR"],
} as const;

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

function hasPositiveNumber(value: unknown): boolean {
  const numeric = toNumber(value);
  return typeof numeric === "number" && numeric > 0;
}

function count<T>(items: T[], predicate: (item: T) => boolean): number {
  return items.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
}

function getEndUseInput(
  energyInputs: EnergyInputLike[],
  endUse: string,
): EnergyInputLike | undefined {
  return energyInputs.find((entry) => entry.endUse === endUse);
}

function endUseConfigured(
  energyInputs: EnergyInputLike[],
  endUses: string[],
): boolean {
  return endUses.some((endUse) => {
    const entry = getEndUseInput(energyInputs, endUse);
    return Boolean(
      entry &&
        entry.energySourceIndex > 1 &&
        hasPositiveNumber(entry.specificConsumption),
    );
  });
}

function getSelectedEnergySources(energyInputs: EnergyInputLike[]): number[] {
  return [
    ...new Set(
      energyInputs
        .filter(
          (entry) =>
            entry.endUse !== "PV_PRODUCTION" && entry.energySourceIndex > 1,
        )
        .map((entry) => entry.energySourceIndex),
    ),
  ];
}

function getConfiguredEnergyPrices(boundaryCondition?: BoundaryConditionLike | null) {
  const energyPrices = Array.isArray(boundaryCondition?.energyPrices)
    ? boundaryCondition.energyPrices
    : [];

  return energyPrices.filter(
    (row) => row.index > 1 && hasPositiveNumber(row.pricePerKwh),
  );
}

function getCostTotal(item: CostItemLike): number {
  if (
    hasPositiveNumber(item.materialCostAgg) ||
    hasPositiveNumber(item.laborCostAgg) ||
    hasPositiveNumber(item.otherCostAgg)
  ) {
    return (
      (toNumber(item.materialCostAgg) ?? 0) +
      (toNumber(item.laborCostAgg) ?? 0) +
      (toNumber(item.otherCostAgg) ?? 0)
    );
  }

  return (
    item.details?.reduce((sum, detail) => {
      const resolvedMaterial = Math.max(
        toNumber(detail.materialCost) ?? 0,
        (toNumber(detail.unitPrice) ?? 0) * (toNumber(detail.area) ?? 0),
      );
      return (
        sum +
        resolvedMaterial +
        (toNumber(detail.laborCost) ?? 0) +
        (toNumber(detail.otherCost) ?? 0)
      );
    }, 0) ?? 0
  );
}

function getGroupTotal(costItems: CostItemLike[], categories: readonly string[]) {
  return costItems
    .filter((item) => categories.includes(item.category))
    .reduce((sum, item) => sum + getCostTotal(item), 0);
}

function hasAnyIncome(incomeInput?: IncomeLike | null) {
  if (!incomeInput) return false;

  return [
    incomeInput.rent1MonthlyPerM2,
    incomeInput.rent1Area,
    incomeInput.rent2MonthlyPerM2,
    incomeInput.rent2Area,
    incomeInput.rent3MonthlyPerM2,
    incomeInput.rent3Area,
    incomeInput.otherIncome1,
    incomeInput.otherIncome2,
    incomeInput.otherIncome3,
  ].some(hasPositiveNumber);
}

export function computeVariantDiffCount(
  baseVariant: VariantLike | null | undefined,
  currentVariant: VariantLike | null | undefined,
): number {
  if (!baseVariant || !currentVariant || baseVariant === currentVariant) {
    return 0;
  }

  const comparisons: Array<boolean> = [];
  const baseGeometry = baseVariant.geometry ?? {};
  const currentGeometry = currentVariant.geometry ?? {};

  for (const key of [
    "grossFloorArea",
    "netFloorArea",
    "treatedFloorArea",
    "grossVolume",
    "windowArea",
    "totalThermalEnvelope",
    "avgUvalueOpaque",
    "airTightness",
    "pvInstalledCapacity",
  ] as const) {
    comparisons.push((baseGeometry[key] ?? 0) !== (currentGeometry[key] ?? 0));
  }

  const baseBoundary = baseVariant.boundaryCondition ?? {};
  const currentBoundary = currentVariant.boundaryCondition ?? {};
  for (const key of [
    "referencePeriod",
    "interestRate",
    "inflationRate",
    "stakeholderRole",
  ] as const) {
    comparisons.push((baseBoundary[key] ?? 0) !== (currentBoundary[key] ?? 0));
  }

  comparisons.push(
    JSON.stringify(baseVariant.energyInputs ?? []) !==
      JSON.stringify(currentVariant.energyInputs ?? []),
  );
  comparisons.push(
    JSON.stringify(baseVariant.costItems ?? []) !==
      JSON.stringify(currentVariant.costItems ?? []),
  );
  comparisons.push(
    JSON.stringify(baseVariant.designCosts ?? []) !==
      JSON.stringify(currentVariant.designCosts ?? []),
  );
  comparisons.push(
    JSON.stringify(baseVariant.incomeInput ?? null) !==
      JSON.stringify(currentVariant.incomeInput ?? null),
  );
  comparisons.push(
    JSON.stringify(baseVariant.maintenanceConfig ?? null) !==
      JSON.stringify(currentVariant.maintenanceConfig ?? null),
  );
  comparisons.push(
    JSON.stringify(baseVariant.serviceComponents ?? []) !==
      JSON.stringify(currentVariant.serviceComponents ?? []),
  );

  return comparisons.filter(Boolean).length;
}

export function computeProjectReadiness(
  project: ProjectLike | null | undefined,
  variant: VariantLike | null | undefined,
): ProjectReadiness {
  const geometry = variant?.geometry ?? null;
  const boundaryCondition = variant?.boundaryCondition ?? null;
  const energyInputs = variant?.energyInputs ?? [];
  const costItems = variant?.costItems ?? [];
  const designCosts = variant?.designCosts ?? [];
  const incomeInput = variant?.incomeInput ?? null;
  const maintenanceConfig = variant?.maintenanceConfig ?? null;
  const serviceComponents = variant?.serviceComponents ?? [];
  const wlcInput = variant?.wlcInput ?? null;
  const buildingUse = (project?.buildingUse ?? "RESIDENTIAL_MULTI") as BuildingUse;

  const selectedEnergySources = getSelectedEnergySources(energyInputs);
  const configuredEnergyPrices = getConfiguredEnergyPrices(boundaryCondition);

  const infoRequiredTotal = 3;
  const infoRequiredFilled = count(
    [
      Boolean(project?.name?.trim()),
      Boolean(project?.buildingUse),
      hasPositiveNumber(geometry?.treatedFloorArea),
    ],
    Boolean,
  );
  const infoRecommendedTotal = 7;
  const infoRecommendedFilled = count(
    [
      Boolean(project?.country?.trim()),
      Boolean(project?.city?.trim()),
      hasPositiveNumber(geometry?.grossFloorArea),
      hasPositiveNumber(geometry?.netFloorArea),
      hasPositiveNumber(geometry?.grossVolume),
      hasPositiveNumber(geometry?.windowArea),
      hasPositiveNumber(geometry?.totalThermalEnvelope),
    ],
    Boolean,
  );

  const wlcRequiredTotal = 4;
  const wlcRequiredFilled = count(
    [
      hasPositiveNumber(boundaryCondition?.referencePeriod),
      typeof toNumber(boundaryCondition?.interestRate) === "number",
      typeof toNumber(boundaryCondition?.inflationRate) === "number",
      typeof toNumber(boundaryCondition?.stakeholderRole) === "number",
    ],
    Boolean,
  );
  const wlcRecommendedTotal = Math.max(selectedEnergySources.length, 1) + 3;
  const designCostTotal = designCosts.reduce(
    (sum, row) =>
      sum +
      (toNumber(row.preliminaryCost) ?? 0) +
      (toNumber(row.definitiveCost) ?? 0) +
      (toNumber(row.executiveCost) ?? 0) +
      (toNumber(row.siteManagementCost) ?? 0),
    0,
  );
  const wlcRecommendedFilled = count(
    [
      hasPositiveNumber(wlcInput?.landArea),
      hasPositiveNumber(wlcInput?.landPrice),
      hasPositiveNumber(designCostTotal),
      ...selectedEnergySources.map((index) =>
        configuredEnergyPrices.some((row) => row.index === index),
      ),
    ],
    Boolean,
  );

  const aGroupTotal = getGroupTotal(costItems, CATEGORY_GROUPS.A);
  const bGroupTotal = getGroupTotal(costItems, CATEGORY_GROUPS.B);
  const cGroupTotal = getGroupTotal(costItems, CATEGORY_GROUPS.C);
  const dGroupTotal = getGroupTotal(costItems, CATEGORY_GROUPS.D);
  const eGroupTotal = getGroupTotal(costItems, CATEGORY_GROUPS.E);
  const totalConstruction = costItems.reduce((sum, item) => sum + getCostTotal(item), 0);

  const constructionRequiredTotal = 3;
  const constructionRequiredFilled = count(
    [
      hasPositiveNumber(totalConstruction),
      hasPositiveNumber(aGroupTotal),
      typeof toNumber(maintenanceConfig?.buildingElementMaintenancePercent) ===
        "number",
    ],
    Boolean,
  );
  const constructionRecommendedTotal = 5;
  const constructionRecommendedFilled = count(
    [
      hasPositiveNumber(aGroupTotal),
      hasPositiveNumber(bGroupTotal),
      hasPositiveNumber(cGroupTotal),
      hasPositiveNumber(dGroupTotal),
      hasPositiveNumber(eGroupTotal),
    ],
    Boolean,
  );

  const heatingConfigured = endUseConfigured(energyInputs, ["HEATING_1", "HEATING_2"]);
  const coolingConfigured = endUseConfigured(energyInputs, ["COOLING_1", "COOLING_2"]);
  const dhwConfigured = endUseConfigured(energyInputs, ["DHW_1", "DHW_2"]);
  const householdConfigured = endUseConfigured(energyInputs, ["HOUSEHOLD_ELECTRICITY"]);
  const pvConfigured = hasPositiveNumber(
    getEndUseInput(energyInputs, "PV_PRODUCTION")?.pvProductionKwh,
  );

  const energyRequiredChecks = [
    heatingConfigured,
    householdConfigured,
    !DHW_REQUIRED_USES.has(buildingUse) || dhwConfigured,
  ];
  const energyRequiredTotal = energyRequiredChecks.length;
  const energyRequiredFilled = count(energyRequiredChecks, Boolean);
  const energyRecommendedChecks = [
    !hasPositiveNumber(geometry?.pvInstalledCapacity) || pvConfigured,
    !coolingConfigured || coolingConfigured,
    selectedEnergySources.length > 0,
  ];
  const energyRecommendedTotal = energyRecommendedChecks.length;
  const energyRecommendedFilled = count(energyRecommendedChecks, Boolean);

  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const infos: ValidationIssue[] = [];

  if (!hasPositiveNumber(geometry?.treatedFloorArea)) {
    blockers.push({
      id: "missing-treated-floor-area",
      section: "info",
      severity: "blocker",
      title: "Missing treated floor area",
      description: "Enter treated floor area to unlock meaningful LCC per m2 results.",
    });
  }

  if (!boundaryCondition) {
    blockers.push({
      id: "missing-boundary-condition",
      section: "wlc",
      severity: "blocker",
      title: "Boundary conditions are incomplete",
      description: "Set the reference period, nominal interest rate, inflation rate, and stakeholder role.",
    });
  }

  if (!hasPositiveNumber(totalConstruction)) {
    blockers.push({
      id: "missing-construction-costs",
      section: "construction",
      severity: "blocker",
      title: "No construction costs entered",
      description: "Add at least one construction estimate before trusting the results.",
    });
  }

  if (!hasPositiveNumber(aGroupTotal)) {
    blockers.push({
      id: "missing-a-group-costs",
      section: "construction",
      severity: "blocker",
      title: "No building-element costs entered",
      description: "At least one A-category cost is required for a usable construction model.",
    });
  }

  if (!heatingConfigured) {
    blockers.push({
      id: "missing-heating-input",
      section: "energy",
      severity: "blocker",
      title: "Heating demand is not configured",
      description: "Select a heating source and enter a specific consumption value.",
    });
  }

  if (!householdConfigured) {
    blockers.push({
      id: "missing-household-input",
      section: "energy",
      severity: "blocker",
      title: "Household electricity is not configured",
      description: "Enter household electricity demand for the active variant.",
    });
  }

  if (DHW_REQUIRED_USES.has(buildingUse) && !dhwConfigured) {
    blockers.push({
      id: "missing-dhw-input",
      section: "energy",
      severity: "blocker",
      title: "Domestic hot water is missing",
      description: "Residential and education studies should include a DHW source and demand.",
    });
  }

  if (
    hasPositiveNumber(geometry?.grossFloorArea) &&
    hasPositiveNumber(geometry?.treatedFloorArea) &&
    (toNumber(geometry?.treatedFloorArea) ?? 0) >
      (toNumber(geometry?.grossFloorArea) ?? 0)
  ) {
    warnings.push({
      id: "tfa-greater-than-gfa",
      section: "info",
      severity: "warning",
      title: "Treated floor area exceeds gross floor area",
      description: "Review GFA, NFA, and TFA definitions. TFA is usually less than or equal to GFA.",
    });
  }

  if (
    hasPositiveNumber(geometry?.grossFloorArea) &&
    hasPositiveNumber(geometry?.netFloorArea) &&
    (toNumber(geometry?.netFloorArea) ?? 0) >
      (toNumber(geometry?.grossFloorArea) ?? 0)
  ) {
    warnings.push({
      id: "nfa-greater-than-gfa",
      section: "info",
      severity: "warning",
      title: "Net floor area exceeds gross floor area",
      description: "This is unusual. Check whether gross and net areas were swapped.",
    });
  }

  if (
    hasPositiveNumber(geometry?.grossFloorArea) &&
    ((toNumber(geometry?.grossFloorArea) ?? 0) < 50 ||
      (toNumber(geometry?.grossFloorArea) ?? 0) > 500000)
  ) {
    warnings.push({
      id: "gfa-outside-range",
      section: "info",
      severity: "warning",
      title: "Gross floor area is outside the usual project range",
      description: "Check for a missing zero or an incorrect unit assumption.",
    });
  }

  if (
    hasPositiveNumber(geometry?.avgUvalueOpaque) &&
    ((toNumber(geometry?.avgUvalueOpaque) ?? 0) < 0.05 ||
      (toNumber(geometry?.avgUvalueOpaque) ?? 0) > 3)
  ) {
    warnings.push({
      id: "opaque-uvalue-outside-range",
      section: "info",
      severity: "warning",
      title: "Opaque U-value looks unusual",
      description: "Review the opaque-envelope U-value. The current value is outside the usual range.",
    });
  }

  if (
    hasPositiveNumber(geometry?.airTightness) &&
    ((toNumber(geometry?.airTightness) ?? 0) < 0.1 ||
      (toNumber(geometry?.airTightness) ?? 0) > 20)
  ) {
    warnings.push({
      id: "airtightness-outside-range",
      section: "info",
      severity: "warning",
      title: "Air tightness looks unusual",
      description: "Check the air-tightness value and confirm the intended unit is 1/h.",
    });
  }

  const heating1 =
    toNumber(getEndUseInput(energyInputs, "HEATING_1")?.specificConsumption) ??
    0;
  const heating2 =
    toNumber(getEndUseInput(energyInputs, "HEATING_2")?.specificConsumption) ??
    0;
  if (heating1 + heating2 > 400) {
    warnings.push({
      id: "heating-demand-high",
      section: "energy",
      severity: "warning",
      title: "Heating demand is unusually high",
      description: "Review the heating demand and confirm the entry is in kWh/m2/year.",
    });
  }

  if (selectedEnergySources.length > configuredEnergyPrices.length) {
    warnings.push({
      id: "missing-energy-prices",
      section: "wlc",
      severity: "warning",
      title: "Some selected energy sources still have no price assumption",
      description: "Add prices for all active energy sources to make O&M comparisons meaningful.",
    });
  }

  if (hasPositiveNumber(geometry?.pvInstalledCapacity) && !pvConfigured) {
    warnings.push({
      id: "pv-capacity-without-production",
      section: "energy",
      severity: "warning",
      title: "PV capacity is entered without PV production",
      description: "Add annual PV production or remove the installed-capacity value if PV is not modeled.",
    });
  }

  if (
    (hasPositiveNumber(bGroupTotal) || hasPositiveNumber(cGroupTotal)) &&
    serviceComponents.length === 0
  ) {
    infos.push({
      id: "missing-service-components",
      section: "construction",
      severity: "info",
      title: "No EN 15459 service components are configured",
      description: "Add service components if you want replacement timing and maintenance percentages from EN 15459.",
    });
  }

  if (!hasAnyIncome(incomeInput)) {
    infos.push({
      id: "income-analysis-disabled",
      section: "info",
      severity: "info",
      title: "Income analysis is not configured",
      description: "Payback and NPV remain informational until rent or other income is entered.",
    });
  }

  const sections: ProjectReadinessSection[] = [
    {
      id: "info",
      label: "Info",
      requiredFilled: infoRequiredFilled,
      requiredTotal: infoRequiredTotal,
      recommendedFilled: infoRecommendedFilled,
      recommendedTotal: infoRecommendedTotal,
      warnings: warnings.filter((issue) => issue.section === "info").length,
      blockers: blockers.filter((issue) => issue.section === "info").length,
      isPreviewReady: infoRequiredFilled === infoRequiredTotal,
    },
    {
      id: "wlc",
      label: "WLC",
      requiredFilled: wlcRequiredFilled,
      requiredTotal: wlcRequiredTotal,
      recommendedFilled: wlcRecommendedFilled,
      recommendedTotal: wlcRecommendedTotal,
      warnings: warnings.filter((issue) => issue.section === "wlc").length,
      blockers: blockers.filter((issue) => issue.section === "wlc").length,
      isPreviewReady: wlcRequiredFilled === wlcRequiredTotal,
    },
    {
      id: "construction",
      label: "Construction",
      requiredFilled: constructionRequiredFilled,
      requiredTotal: constructionRequiredTotal,
      recommendedFilled: constructionRecommendedFilled,
      recommendedTotal: constructionRecommendedTotal,
      warnings: warnings.filter((issue) => issue.section === "construction").length,
      blockers: blockers.filter((issue) => issue.section === "construction").length,
      isPreviewReady: constructionRequiredFilled === constructionRequiredTotal,
    },
    {
      id: "energy",
      label: "Energy",
      requiredFilled: energyRequiredFilled,
      requiredTotal: energyRequiredTotal,
      recommendedFilled: energyRecommendedFilled,
      recommendedTotal: energyRecommendedTotal,
      warnings: warnings.filter((issue) => issue.section === "energy").length,
      blockers: blockers.filter((issue) => issue.section === "energy").length,
      isPreviewReady: energyRequiredFilled === energyRequiredTotal,
    },
    {
      id: "results",
      label: "Results",
      requiredFilled: blockers.length === 0 ? 1 : 0,
      requiredTotal: 1,
      recommendedFilled: warnings.length === 0 ? 1 : 0,
      recommendedTotal: 1,
      warnings: warnings.length,
      blockers: blockers.length,
      isPreviewReady: blockers.length === 0,
    },
  ];

  const requiredFilled = sections.reduce((sum, section) => sum + section.requiredFilled, 0);
  const requiredTotal = sections.reduce((sum, section) => sum + section.requiredTotal, 0);
  const recommendedFilled = sections.reduce(
    (sum, section) => sum + section.recommendedFilled,
    0,
  );
  const recommendedTotal = sections.reduce(
    (sum, section) => sum + section.recommendedTotal,
    0,
  );

  const previewReady = blockers.length === 0 && sections.every((section) => section.isPreviewReady);
  const analysisRatio =
    recommendedTotal === 0 ? 0 : recommendedFilled / recommendedTotal;
  const analysisReady = previewReady && analysisRatio >= 0.7;
  const publishReady = analysisReady && analysisRatio >= 0.9 && warnings.length === 0;

  let status: VariantReadinessStatus = "empty";
  let statusLabel = "Empty";

  if (requiredFilled > 0 || recommendedFilled > 0) {
    status = "draft";
    statusLabel = "Draft";
  }
  if (previewReady) {
    status = "preview_ready";
    statusLabel = "Preview-ready";
  }
  if (analysisReady) {
    status = "analysis_ready";
    statusLabel = "Analysis-ready";
  }
  if (publishReady) {
    status = "publish_ready";
    statusLabel = "Publish-ready";
  }

  return {
    status,
    statusLabel,
    sections,
    blockers,
    warnings,
    infos,
    requiredFilled,
    requiredTotal,
    recommendedFilled,
    recommendedTotal,
    previewReady,
    analysisReady,
    publishReady,
  };
}

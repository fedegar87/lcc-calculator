import type { VariantInput, CostItemInput } from '../types';
import { CATEGORY_MAINTENANCE_MAP } from '../types';
import { getEN15459Component } from '../constants';
import type {
  ParameterSpec,
  ParameterBounds,
  VariationScheme,
} from './types';

function cloneInput(input: VariantInput): VariantInput {
  return {
    ...input,
    energyPrices: input.energyPrices.map((p) => ({ ...p })),
    energyInputs: input.energyInputs.map((e) => ({ ...e })),
    costItems: input.costItems.map((c) => ({ ...c })),
    serviceComponents: input.serviceComponents.map((s) => ({ ...s })),
    wlcInput: { ...input.wlcInput },
    designCosts: input.designCosts.map((d) => ({ ...d })),
    incomeInput: input.incomeInput
      ? {
          rents: input.incomeInput.rents.map((r) => ({ ...r })),
          otherIncomes: input.incomeInput.otherIncomes.map((i) => ({ ...i })),
          expectedPricePerM2: input.incomeInput.expectedPricePerM2,
        }
      : undefined,
  };
}

function categoryTotal(items: CostItemInput[], category: string): number {
  return items
    .filter((c) => c.category === category)
    .reduce(
      (sum, c) => sum + c.materialCost + c.laborCost + c.otherCost,
      0,
    );
}

function scaleCategory(
  input: VariantInput,
  category: string,
  newTotal: number,
): VariantInput {
  const oldTotal = categoryTotal(input.costItems, category);
  if (oldTotal <= 0) return cloneInput(input);
  const factor = newTotal / oldTotal;
  const next = cloneInput(input);
  next.costItems = next.costItems.map((c) =>
    c.category === category
      ? {
          ...c,
          materialCost: c.materialCost * factor,
          laborCost: c.laborCost * factor,
          otherCost: c.otherCost * factor,
        }
      : c,
  );
  return next;
}

const INTEREST_RATE: ParameterSpec = {
  id: 'interestRate',
  label: 'Interest rate',
  group: 'finance',
  applicable: () => true,
  baseline: (input) => input.interestRate,
  apply: (input, value) => ({ ...cloneInput(input), interestRate: value }),
  defaultBounds: {
    fixedPct: {
      min: -0.1,
      max: 0.1,
      scale: 'fractionalOffset',
      distribution: 'uniform',
      source: 'paper-fixed-10pct',
    },
    literature: {
      min: 0.0025,
      max: 0.05,
      scale: 'absolute',
      distribution: 'uniform',
      source: 'Pernetti 2021 Table 2 [FRED INTDSREZQ193N, Euro area 2009-2016]',
    },
  },
};

const BUILDING_ELEMENT_MAINTENANCE: ParameterSpec = {
  id: 'buildingElementMaintenancePercent',
  label: 'Maintenance cost — building elements (% of construction)',
  group: 'maintenance',
  applicable: () => true,
  baseline: (input) => input.buildingElementMaintenancePercent,
  apply: (input, value) => ({
    ...cloneInput(input),
    buildingElementMaintenancePercent: value,
  }),
  defaultBounds: {
    fixedPct: {
      min: -0.1,
      max: 0.1,
      scale: 'fractionalOffset',
      distribution: 'uniform',
      source: 'paper-fixed-10pct',
    },
    literature: {
      min: 0.01,
      max: 0.02,
      scale: 'absolute',
      distribution: 'uniform',
      source: 'Pernetti 2021 Table 2 [EN 15459-1:2017]',
    },
  },
};

const HVAC_MAINTENANCE_MULTIPLIER: ParameterSpec = {
  id: 'service.hvac.maintenancePctMultiplier',
  label: 'Maintenance cost — HVAC services (multiplier on EN 15459 avg)',
  group: 'service',
  applicable: (input) => input.serviceComponents.length > 0,
  baseline: () => 1,
  apply: (input, multiplier) => {
    const next = cloneInput(input);
    next.serviceComponents = next.serviceComponents.map((sc) => {
      const c = getEN15459Component(sc.en15459ComponentIndex);
      const basePct = c?.maintenancePctAvg ?? null;
      if (basePct == null) return sc;
      return { ...sc, maintenancePctOverride: basePct * multiplier };
    });
    return next;
  },
  defaultBounds: {
    fixedPct: {
      min: 0.9,
      max: 1.1,
      scale: 'absolute',
      distribution: 'uniform',
      source: 'paper-fixed-10pct',
    },
    literature: {
      // Spec §3.2: EN 15459 component min/max imply a ~±50% multiplier
      // envelope when computed across the catalogue; conservative range here.
      min: 0.5,
      max: 1.5,
      scale: 'absolute',
      distribution: 'uniform',
      source: 'EN 15459-1:2017 component min/max ranges',
    },
  },
};

function makeCostCategoryParam(
  category: string,
  label: string,
): ParameterSpec {
  return {
    id: `costItems.${category}.totalCost`,
    label,
    group: 'construction',
    applicable: (input) => categoryTotal(input.costItems, category) > 0,
    baseline: (input) => categoryTotal(input.costItems, category),
    apply: (input, value) => scaleCategory(input, category, value),
    defaultBounds: {
      fixedPct: {
        min: -0.1,
        max: 0.1,
        scale: 'fractionalOffset',
        distribution: 'uniform',
        source: 'paper-fixed-10pct',
      },
    },
  };
}

const STRUCTURE_COST = makeCostCategoryParam(
  'A9_STRUCTURE',
  'Construction cost — structural elements',
);
const ROOFS_COST = makeCostCategoryParam(
  'A1_ROOFS',
  'Construction cost — roofs / flat-roof insulation',
);
const FACADES_COST = makeCostCategoryParam(
  'A2_FACADES',
  'Construction cost — facades / external insulation',
);
const FLOORS_COST = makeCostCategoryParam(
  'A3_FLOORS',
  'Construction cost — floors / ground-floor insulation',
);
const WINDOWS_COST = makeCostCategoryParam(
  'A5_WINDOWS',
  'Construction cost — windows',
);

export const DEFAULT_PARAMETER_REGISTRY: ParameterSpec[] = [
  INTEREST_RATE,
  BUILDING_ELEMENT_MAINTENANCE,
  HVAC_MAINTENANCE_MULTIPLIER,
  STRUCTURE_COST,
  ROOFS_COST,
  FACADES_COST,
  FLOORS_COST,
  WINDOWS_COST,
];

export function getParameterSpec(id: string): ParameterSpec | undefined {
  return DEFAULT_PARAMETER_REGISTRY.find((p) => p.id === id);
}

export function listApplicableParameters(
  input: VariantInput,
): ParameterSpec[] {
  return DEFAULT_PARAMETER_REGISTRY.filter((p) => p.applicable(input));
}

/** Convert a ParameterBounds into absolute [min, max] in apply()-space, given
 *  the current baseline. For `fractionalOffset` bounds: [baseline*(1+min),
 *  baseline*(1+max)]. For `absolute`: returns the stored values unchanged. */
export function resolveAbsoluteBounds(
  spec: ParameterSpec,
  input: VariantInput,
  scheme: VariationScheme,
): { min: number; max: number; bounds: ParameterBounds } | null {
  const bounds =
    scheme === 'literature'
      ? spec.defaultBounds.literature ?? spec.defaultBounds.fixedPct
      : spec.defaultBounds.fixedPct;
  if (!bounds) return null;
  if (bounds.scale === 'absolute') {
    return { min: bounds.min, max: bounds.max, bounds };
  }
  const b = spec.baseline(input);
  return { min: b * (1 + bounds.min), max: b * (1 + bounds.max), bounds };
}

export { cloneInput, categoryTotal, scaleCategory, CATEGORY_MAINTENANCE_MAP };

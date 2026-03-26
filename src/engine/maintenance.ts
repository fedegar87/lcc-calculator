// MNT-001 through MNT-004, MNT-BUG-001, CAL-005..008: Maintenance cost calculations

import type { VariantInput, EngineConfig } from './types';
import { CATEGORY_MAINTENANCE_MAP } from './types';
import { getEN15459Component } from './constants';

export interface MaintenanceCostResult {
  elements: number[]; // MNT-001: building element maintenance per year
  elementsCumulated: number[]; // MNT-002: cumulated
  services: number[]; // MNT-003 + MNT-004: building service maintenance per year (includes replacements)
  servicesCumulated: number[]; // cumulated services
  total: number[]; // elements + services per year
  totalCumulated: number[]; // cumulated total
  // CAL-005..008 values at referencePeriod
  totalMaintenanceElements: number; // CAL-005
  totalMaintenanceServices: number; // CAL-006
  totalMaintenance: number; // CAL-007
  maintenanceCostPerM2: number; // CAL-008 (0 if area=0)
}

/**
 * Compute building element and service maintenance costs.
 * CRITICAL: All discounting uses interestRate (Rint, nominal), NOT real rate (DEC-005).
 */
export function computeMaintenanceCosts(
  input: VariantInput,
  config: EngineConfig,
): MaintenanceCostResult {
  const { referencePeriod, interestRate, treatedFloorArea } = input;
  const n = referencePeriod;

  // --- MNT-001, MNT-002: Building element maintenance ---
  const elementConstruction = input.costItems
    .filter(
      (ci) => CATEGORY_MAINTENANCE_MAP[ci.category] === 'building_element',
    )
    .reduce((sum, ci) => sum + ci.materialCost + ci.laborCost + ci.otherCost, 0);

  const elements = new Array<number>(n + 1);
  const elementsCumulated = new Array<number>(n + 1);
  elements[0] = 0;
  elementsCumulated[0] = 0;

  for (let year = 1; year <= n; year++) {
    // MNT-001: totalConstruction * maintenancePercent / (1 + Rint)^year
    elements[year] =
      (elementConstruction * input.buildingElementMaintenancePercent) /
      Math.pow(1 + interestRate, year);
    // MNT-002: running sum
    elementsCumulated[year] = elementsCumulated[year - 1] + elements[year];
  }

  // --- MNT-003, MNT-004: Building service maintenance ---
  const services = new Array<number>(n + 1).fill(0);
  const servicesCumulated = new Array<number>(n + 1);
  servicesCumulated[0] = 0;

  for (let scIdx = 0; scIdx < input.serviceComponents.length; scIdx++) {
    const sc = input.serviceComponents[scIdx];
    const component = getEN15459Component(sc.en15459ComponentIndex);
    const lifespan = component ? component.lifespanAvg : 0;
    const maintenancePct =
      component && component.maintenancePctAvg !== null
        ? component.maintenancePctAvg
        : 0;

    let replacementsUsed = 0;

    for (let year = 1; year <= n; year++) {
      const isReplacementYear =
        lifespan > 0 &&
        year % lifespan === 0 &&
        replacementsUsed < config.maxReplacementCycles;

      if (isReplacementYear) {
        // MNT-004: Replacement — charge full construction cost
        let exponent = year;

        // MNT-BUG-001: In excel_replica mode, last service component uses exponent 9
        // Excel bug: Maintenance!I62 uses column I header (year 9) instead of actual year
        if (
          config.formulaMode === 'excel_replica' &&
          scIdx === input.serviceComponents.length - 1
        ) {
          exponent = 9;
        }

        services[year] +=
          sc.constructionCost / Math.pow(1 + interestRate, exponent);
        replacementsUsed++;
      } else {
        // MNT-003: Annual maintenance
        services[year] +=
          (sc.constructionCost * maintenancePct) /
          Math.pow(1 + interestRate, year);
      }
    }
  }

  // Cumulate services
  for (let year = 1; year <= n; year++) {
    servicesCumulated[year] = servicesCumulated[year - 1] + services[year];
  }

  // --- Totals ---
  const total = new Array<number>(n + 1);
  const totalCumulated = new Array<number>(n + 1);
  total[0] = 0;
  totalCumulated[0] = 0;

  for (let year = 1; year <= n; year++) {
    total[year] = elements[year] + services[year];
    totalCumulated[year] = totalCumulated[year - 1] + total[year];
  }

  // CAL-005..008
  const totalMaintenanceElements = elementsCumulated[n];
  const totalMaintenanceServices = servicesCumulated[n];
  const totalMaintenance = totalMaintenanceElements + totalMaintenanceServices;
  const maintenanceCostPerM2 =
    treatedFloorArea > 0 ? totalMaintenance / treatedFloorArea : 0;

  return {
    elements,
    elementsCumulated,
    services,
    servicesCumulated,
    total,
    totalCumulated,
    totalMaintenanceElements,
    totalMaintenanceServices,
    totalMaintenance,
    maintenanceCostPerM2,
  };
}

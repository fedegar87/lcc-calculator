import type { VariantInput } from '@/engine/types';

/**
 * Best-effort approximation of the Väla Gård case study from
 * Pernetti et al. 2021 (Table 1: office, Helsingborg SE, NFA 1670 m²,
 * Uwall 0.11, Uwin 0.58, final energy 48 kWh/m²a, year 2012, district
 * heating + electricity). Several line items (per-component cost splits,
 * inflation rate, treated-floor-area derivation) are interpolated since
 * the paper does not publish them at line-item granularity. The fixture
 * exists for two reasons:
 *
 *  1. Regression test that the SA module produces a paper-consistent
 *     ranking (top-4 dominated by interest rate + structural construction
 *     + maintenance — see Pernetti 2021 §3.1).
 *  2. A realistic non-trivial VariantInput shape exercising every code
 *     path the SA lens registry touches.
 *
 * Not suitable as a "Pernetti-exact" benchmark — the absolute LCC value
 * will differ from the paper's because line-item splits and several
 * boundary fields had to be interpolated. The SA *ranking*, which is
 * what the paper demonstrates is robust, is what we test against.
 */
export function valaGardFixture(): VariantInput {
  return {
    referencePeriod: 40,
    interestRate: 0.0151,
    inflationRate: 0.0056,
    treatedFloorArea: 1670,
    energyPrices: [
      // Sweden district heating: paper Table 2 baseline 0.187 €/kWh
      { index: 7, name: 'District heating', pricePerKwh: 0.187, annualIncrease: 0.01 },
      // Sweden electricity household: paper Table 2 baseline 0.12 €/kWh
      { index: 12, name: 'Electricity (mix)', pricePerKwh: 0.12, annualIncrease: 0.01 },
      { index: 13, name: 'PV self-consumption', pricePerKwh: 0.12, annualIncrease: 0 },
    ],
    energyInputs: [
      // Final energy 48 kWh/m²a split across end uses (paper Table 1; per-end-use
      // split interpolated from typical Swedish office benchmarks).
      { endUse: 'HEATING_1', energySourceIndex: 7, specificConsumption: 18 },
      { endUse: 'DHW_1', energySourceIndex: 7, specificConsumption: 4 },
      { endUse: 'COOLING_1', energySourceIndex: 12, specificConsumption: 1 },
      { endUse: 'HOUSEHOLD_ELECTRICITY', energySourceIndex: 12, specificConsumption: 25 },
    ],
    costItems: [
      // Construction cost breakdown — magnitudes consistent with a 1670 m²
      // Swedish nZEB office (rough order: 2200 €/m² total, ~50% structure).
      { category: 'A1_ROOFS', materialCost: 90_000, laborCost: 45_000, otherCost: 0 },
      { category: 'A2_FACADES', materialCost: 240_000, laborCost: 110_000, otherCost: 0 },
      { category: 'A3_FLOORS', materialCost: 60_000, laborCost: 30_000, otherCost: 0 },
      { category: 'A5_WINDOWS', materialCost: 180_000, laborCost: 60_000, otherCost: 0 },
      { category: 'A8_INTERNAL', materialCost: 200_000, laborCost: 100_000, otherCost: 0 },
      { category: 'A9_STRUCTURE', materialCost: 1_200_000, laborCost: 500_000, otherCost: 0 },
      { category: 'B1_HEATING', materialCost: 90_000, laborCost: 40_000, otherCost: 0 },
      { category: 'B3_VENTILATION', materialCost: 130_000, laborCost: 60_000, otherCost: 0 },
      { category: 'B5_ELECTRICAL', materialCost: 110_000, laborCost: 50_000, otherCost: 0 },
      { category: 'C2_PV', materialCost: 60_000, laborCost: 30_000, otherCost: 0 },
      { category: 'E1_OUTDOOR', materialCost: 70_000, laborCost: 30_000, otherCost: 0 },
    ],
    serviceComponents: [
      // EN 15459 component indices: 6 = boiler condensing, 11 = heat pump,
      // 35 = MVHR, 60 = PV. The exact indices depend on en15459.json — these
      // are within the 1-79 range that the validator accepts.
      { name: 'District heating substation', constructionCost: 50_000, en15459ComponentIndex: 6 },
      { name: 'MVHR unit', constructionCost: 90_000, en15459ComponentIndex: 35 },
      { name: 'PV array', constructionCost: 50_000, en15459ComponentIndex: 60 },
      { name: 'Building automation', constructionCost: 35_000, en15459ComponentIndex: 70 },
    ],
    buildingElementMaintenancePercent: 0.015,
    wlcInput: {
      landCost: 350_000,
      enablingCosts: 20_000,
      planningFees: 10_000,
      userSupportPropMgmt: 0,
      userSupportCharges: 0,
      userSupportAdmin: 0,
      financeCost: 0,
      designCostsTotal: 180_000,
      siteManagementCostsTotal: 70_000,
    },
    designCosts: [],
  };
}

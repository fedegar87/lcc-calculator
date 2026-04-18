// NRG-001 through NRG-007: Energy cost calculations

import type {
  VariantInput,
  YearlyEnergyCosts,
  EnergySourcePrice,
  EnergyEndUseInput,
  FormulaMode,
} from './types';
import { END_USE_PAIRS } from './types';
import { computeDiscountFactors } from './discount';

export interface EnergyCostResult {
  heating: YearlyEnergyCosts;
  cooling: YearlyEnergyCosts;
  dhw: YearlyEnergyCosts;
  household: YearlyEnergyCosts;
  pv: YearlyEnergyCosts;
}

// PV always uses energy source index 13 ("Electricity from Photovoltaics")
// Verified from Excel: Calc!E28 = D28 + PI!$G$143 * D28 where G143 = source index 13
const PV_SOURCE_INDEX = 13;

/** NRG-001: Compound price escalation per energy source. */
function escalatePrice(
  initialPrice: number,
  annualIncrease: number,
  referencePeriod: number,
): number[] {
  const prices = new Array<number>(referencePeriod + 1);
  prices[0] = initialPrice;
  for (let year = 1; year <= referencePeriod; year++) {
    prices[year] = prices[year - 1] * (1 + annualIncrease);
  }
  return prices;
}

function computeCostsFromTotalConsumption(
  totalConsumptionKwh: number,
  prices: number[],
  realRate: number,
  referencePeriod: number,
): YearlyEnergyCosts {
  const nominal = new Array<number>(referencePeriod + 1);
  const actualized = new Array<number>(referencePeriod + 1);
  const cumulated = new Array<number>(referencePeriod + 1);
  const discountFactors = computeDiscountFactors(realRate, referencePeriod);

  nominal[0] = 0;
  actualized[0] = 0;
  cumulated[0] = 0;

  for (let year = 1; year <= referencePeriod; year++) {
    nominal[year] = totalConsumptionKwh * prices[year];
    actualized[year] = nominal[year] * discountFactors[year];
    cumulated[year] = cumulated[year - 1] + actualized[year];
  }

  return { nominal, actualized, cumulated };
}

/** Sum two YearlyEnergyCosts element-wise (for dual-system pairs). */
function addYearlyCosts(
  a: YearlyEnergyCosts,
  b: YearlyEnergyCosts,
): YearlyEnergyCosts {
  return {
    nominal: a.nominal.map((v, i) => v + b.nominal[i]),
    actualized: a.actualized.map((v, i) => v + b.actualized[i]),
    cumulated: a.cumulated.map((v, i) => v + b.cumulated[i]),
  };
}

/** Create zero-filled YearlyEnergyCosts for missing end-uses. */
function zeroYearlyCosts(referencePeriod: number): YearlyEnergyCosts {
  const zeros = new Array<number>(referencePeriod + 1).fill(0);
  return { nominal: [...zeros], actualized: [...zeros], cumulated: [...zeros] };
}

/** Find an energy source by index, return null if not found. */
function findEnergySource(
  prices: EnergySourcePrice[],
  index: number,
): EnergySourcePrice | null {
  return prices.find((p) => p.index === index) ?? null;
}

function buildEscalatedPriceSeries(
  energyPrices: EnergySourcePrice[],
  initialPriceSourceIndex: number,
  annualIncreaseSourceIndex: number,
  referencePeriod: number,
): number[] | null {
  const initialSource = findEnergySource(energyPrices, initialPriceSourceIndex);
  if (!initialSource) return null;

  const annualIncreaseSource =
    findEnergySource(energyPrices, annualIncreaseSourceIndex) ?? initialSource;

  return escalatePrice(
    initialSource.pricePerKwh,
    annualIncreaseSource.annualIncrease,
    referencePeriod,
  );
}

/** Find an energy end-use input by endUse name. */
function findEndUseInput(
  inputs: EnergyEndUseInput[],
  endUse: string,
): EnergyEndUseInput | null {
  return inputs.find((ei) => ei.endUse === endUse) ?? null;
}

/** Compute costs for a single system (one end-use input entry). */
function computeSingleSystemCosts(
  endUseInput: EnergyEndUseInput | null,
  energyPrices: EnergySourcePrice[],
  treatedFloorArea: number,
  realRate: number,
  referencePeriod: number,
  options?: {
    initialPriceSourceIndex?: number;
    annualIncreaseSourceIndex?: number;
    totalConsumptionKwh?: number;
  },
): YearlyEnergyCosts {
  if (!endUseInput) return zeroYearlyCosts(referencePeriod);

  const prices = buildEscalatedPriceSeries(
    energyPrices,
    options?.initialPriceSourceIndex ?? endUseInput.energySourceIndex,
    options?.annualIncreaseSourceIndex ?? endUseInput.energySourceIndex,
    referencePeriod,
  );
  if (!prices) return zeroYearlyCosts(referencePeriod);

  const totalConsumptionKwh =
    options?.totalConsumptionKwh ??
    endUseInput.specificConsumption * treatedFloorArea;

  return computeCostsFromTotalConsumption(
    totalConsumptionKwh,
    prices,
    realRate,
    referencePeriod,
  );
}

/**
 * Main energy cost computation across all end-use types.
 * - Heating/Cooling/DHW: dual-system (system 1 + system 2 summed)
 * - Household: single system
 * - PV: uses fixed source index 13, costs are positive (subtraction in aggregate)
 */
export function computeEnergyCosts(
  input: VariantInput,
  realRate: number,
  formulaMode: FormulaMode = 'excel_bugfixed',
): EnergyCostResult {
  const { energyPrices, energyInputs, treatedFloorArea, referencePeriod } =
    input;

  // Process dual-system pairs: heating, cooling, DHW
  const pairResults: YearlyEnergyCosts[] = END_USE_PAIRS.slice(0, 3).map(
    ([primary, secondary]) => {
      const sys1 = computeSingleSystemCosts(
        findEndUseInput(energyInputs, primary),
        energyPrices,
        treatedFloorArea,
        realRate,
        referencePeriod,
      );

      if (secondary === null) return sys1;

      const sys2 = computeSingleSystemCosts(
        findEndUseInput(energyInputs, secondary),
        energyPrices,
        treatedFloorArea,
        realRate,
        referencePeriod,
      );

      return addYearlyCosts(sys1, sys2);
    },
  );

  const householdInput = findEndUseInput(energyInputs, 'HOUSEHOLD_ELECTRICITY');
  const dhwPrimaryInput = findEndUseInput(energyInputs, 'DHW_1');
  const household = computeSingleSystemCosts(
    householdInput,
    energyPrices,
    treatedFloorArea,
    realRate,
    referencePeriod,
    householdInput
      ? {
          annualIncreaseSourceIndex:
            formulaMode === 'excel_replica'
              ? (dhwPrimaryInput?.energySourceIndex ??
                householdInput.energySourceIndex)
              : householdInput.energySourceIndex,
        }
      : undefined,
  );

  const pvInput = findEndUseInput(energyInputs, 'PV_PRODUCTION');
  const pv = pvInput
    ? computeSingleSystemCosts(
        pvInput,
        energyPrices,
        treatedFloorArea,
        realRate,
        referencePeriod,
        pvInput.pvProductionKwh
          ? {
              initialPriceSourceIndex: PV_SOURCE_INDEX,
              annualIncreaseSourceIndex: PV_SOURCE_INDEX,
              totalConsumptionKwh: pvInput.pvProductionKwh,
            }
          : {
              initialPriceSourceIndex: PV_SOURCE_INDEX,
              annualIncreaseSourceIndex: PV_SOURCE_INDEX,
            },
      )
    : zeroYearlyCosts(referencePeriod);

  return {
    heating: pairResults[0],
    cooling: pairResults[1],
    dhw: pairResults[2],
    household,
    pv,
  };
}

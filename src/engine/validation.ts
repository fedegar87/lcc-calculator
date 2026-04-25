import type { VariantInput } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkFinite(
  errors: string[],
  label: string,
  value: unknown,
): value is number {
  if (!isFiniteNumber(value)) {
    errors.push(`${label} must be a finite number`);
    return false;
  }
  return true;
}

function checkNonNegative(errors: string[], label: string, value: unknown) {
  if (!checkFinite(errors, label, value)) return;
  if (value < 0) errors.push(`${label} cannot be negative`);
}

function checkOptionalNonNegative(
  errors: string[],
  label: string,
  value: unknown,
) {
  if (value === undefined || value === null) return;
  checkNonNegative(errors, label, value);
}

function hasActiveConsumption(input: {
  specificConsumption: number;
  pvProductionKwh?: number;
}) {
  return input.specificConsumption > 0 || (input.pvProductionKwh ?? 0) > 0;
}

export function validateVariantInput(input: VariantInput): string[] {
  const errors: string[] = [];

  // Reference period: must be > 0 and <= 100
  if (checkFinite(errors, 'Reference period', input.referencePeriod)) {
    if (!Number.isInteger(input.referencePeriod))
      errors.push('Reference period must be a whole number of years');
    if (input.referencePeriod <= 0)
      errors.push('Reference period must be greater than 0');
    if (input.referencePeriod > 100)
      errors.push('Reference period must not exceed 100 years');
  }

  // Interest rate: plausible range [-10%, 50%]
  if (checkFinite(errors, 'Interest rate', input.interestRate)) {
    if (input.interestRate < -0.1 || input.interestRate > 0.5)
      errors.push('Interest rate out of plausible range (-10% to 50%)');
  }

  // Inflation rate: plausible range [-10%, 50%]
  if (checkFinite(errors, 'Inflation rate', input.inflationRate)) {
    if (input.inflationRate < -0.1 || input.inflationRate > 0.5)
      errors.push('Inflation rate out of plausible range (-10% to 50%)');
  }

  // Treated floor area: non-negative (0 is valid, KPIs will be null)
  checkNonNegative(errors, 'Treated floor area', input.treatedFloorArea);

  const activePriceIndexes = new Set<number>();
  for (const price of input.energyPrices) {
    const label = `Energy source price ${price.index}`;
    if (!Number.isInteger(price.index) || price.index < 1 || price.index > 19) {
      errors.push(`Energy source price index ${price.index} out of range (1-19)`);
    }
    checkNonNegative(errors, `${label} price`, price.pricePerKwh);
    if (checkFinite(errors, `${label} annual increase`, price.annualIncrease)) {
      if (price.annualIncrease < -1 || price.annualIncrease > 1) {
        errors.push(
          `${label} annual increase out of plausible range (-100% to 100%)`,
        );
      }
    }
    if (isFiniteNumber(price.pricePerKwh) && price.pricePerKwh > 0) {
      activePriceIndexes.add(price.index);
    }
  }

  // Energy source index: valid range 1-19
  for (const ei of input.energyInputs) {
    if (!Number.isInteger(ei.energySourceIndex) || ei.energySourceIndex < 1 || ei.energySourceIndex > 19)
      errors.push(
        `Energy source index ${ei.energySourceIndex} out of range (1-19)`,
      );
    checkNonNegative(
      errors,
      `Energy input ${ei.endUse} specific consumption`,
      ei.specificConsumption,
    );
    checkOptionalNonNegative(
      errors,
      `Energy input ${ei.endUse} PV production`,
      ei.pvProductionKwh,
    );

    if (!isFiniteNumber(ei.specificConsumption)) continue;
    const activity = hasActiveConsumption(ei);
    const isPv = ei.endUse === 'PV_PRODUCTION';
    if (activity && ei.energySourceIndex <= 1 && !isPv) {
      errors.push(
        `Energy input ${ei.endUse} has consumption but no energy source selected`,
      );
    }
    if (!activity && ei.energySourceIndex > 1) {
      errors.push(
        `Energy input ${ei.endUse} has source ${ei.energySourceIndex} selected with zero consumption`,
      );
    }
    if (activity && !isPv && ei.energySourceIndex > 1) {
      if (!activePriceIndexes.has(ei.energySourceIndex)) {
        errors.push(
          `Energy input ${ei.endUse} uses source ${ei.energySourceIndex}, but no active energy price is configured`,
        );
      }
    }
    if (isPv && activity && !activePriceIndexes.has(13)) {
      errors.push(
        'PV production requires an active source 13 energy price',
      );
    }
  }

  // Duplicate endUse check
  const endUses = input.energyInputs.map((ei) => ei.endUse);
  const uniqueEndUses = new Set(endUses);
  if (endUses.length !== uniqueEndUses.size)
    errors.push('Duplicate endUse entries found');

  // EN 15459 component index: valid range 1-79
  for (const sc of input.serviceComponents) {
    checkNonNegative(
      errors,
      `Service component ${sc.name} construction cost`,
      sc.constructionCost,
    );
    if (!Number.isInteger(sc.en15459ComponentIndex) || sc.en15459ComponentIndex < 1 || sc.en15459ComponentIndex > 79)
      errors.push(
        `EN 15459 component index ${sc.en15459ComponentIndex} out of range (1-79)`,
      );
  }

  // Non-negative costs in costItems
  for (const ci of input.costItems) {
    checkNonNegative(errors, `${ci.category} material cost`, ci.materialCost);
    checkNonNegative(errors, `${ci.category} labor cost`, ci.laborCost);
    checkNonNegative(errors, `${ci.category} other cost`, ci.otherCost);
  }

  for (const dc of input.designCosts) {
    checkNonNegative(
      errors,
      `Design cost line ${dc.lineNumber} preliminary cost`,
      dc.preliminaryCost,
    );
    checkNonNegative(
      errors,
      `Design cost line ${dc.lineNumber} definitive cost`,
      dc.definitiveCost,
    );
    checkNonNegative(
      errors,
      `Design cost line ${dc.lineNumber} executive cost`,
      dc.executiveCost,
    );
    checkNonNegative(
      errors,
      `Design cost line ${dc.lineNumber} site management cost`,
      dc.siteManagementCost,
    );
  }

  // Non-negative building element maintenance percentage
  if (
    checkFinite(
      errors,
      'Building element maintenance percentage',
      input.buildingElementMaintenancePercent,
    )
  ) {
    if (input.buildingElementMaintenancePercent < 0)
      errors.push('Building element maintenance percentage cannot be negative');
    if (input.buildingElementMaintenancePercent > 1)
      errors.push('Building element maintenance percentage cannot exceed 100%');
  }

  checkNonNegative(errors, 'WLC land cost', input.wlcInput.landCost);
  checkOptionalNonNegative(errors, 'WLC land area', input.wlcInput.landArea);
  checkOptionalNonNegative(errors, 'WLC land price', input.wlcInput.landPrice);
  checkOptionalNonNegative(
    errors,
    'WLC land cost total',
    input.wlcInput.landCostTotal,
  );
  checkNonNegative(errors, 'WLC enabling costs', input.wlcInput.enablingCosts);
  checkNonNegative(errors, 'WLC planning fees', input.wlcInput.planningFees);
  checkNonNegative(
    errors,
    'WLC user support property management',
    input.wlcInput.userSupportPropMgmt,
  );
  checkNonNegative(
    errors,
    'WLC user support charges',
    input.wlcInput.userSupportCharges,
  );
  checkNonNegative(
    errors,
    'WLC user support administration',
    input.wlcInput.userSupportAdmin,
  );
  checkNonNegative(errors, 'WLC finance cost', input.wlcInput.financeCost);
  checkNonNegative(
    errors,
    'WLC design costs total',
    input.wlcInput.designCostsTotal,
  );
  checkNonNegative(
    errors,
    'WLC site management costs total',
    input.wlcInput.siteManagementCostsTotal,
  );

  for (const [index, rent] of input.incomeInput?.rents.entries() ?? []) {
    checkNonNegative(
      errors,
      `Income rent ${index + 1} monthly amount`,
      rent.monthlyPerM2,
    );
    checkNonNegative(errors, `Income rent ${index + 1} area`, rent.area);
    checkNonNegative(errors, `Income rent ${index + 1} taxes`, rent.taxes);
  }

  for (const [index, income] of input.incomeInput?.otherIncomes.entries() ?? []) {
    checkNonNegative(errors, `Other income ${index + 1} amount`, income.amount);
    checkNonNegative(errors, `Other income ${index + 1} taxes`, income.taxes);
  }

  checkOptionalNonNegative(
    errors,
    'Income expected price per m2',
    input.incomeInput?.expectedPricePerM2,
  );

  return errors;
}

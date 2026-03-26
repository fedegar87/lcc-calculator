import type { VariantInput } from './types';

export function validateVariantInput(input: VariantInput): string[] {
  const errors: string[] = [];

  // Reference period: must be > 0 and <= 100
  if (input.referencePeriod <= 0)
    errors.push('Reference period must be greater than 0');
  if (input.referencePeriod > 100)
    errors.push('Reference period must not exceed 100 years');

  // Interest rate: plausible range [-10%, 50%]
  if (input.interestRate < -0.1 || input.interestRate > 0.5)
    errors.push('Interest rate out of plausible range (-10% to 50%)');

  // Inflation rate: plausible range [-10%, 50%]
  if (input.inflationRate < -0.1 || input.inflationRate > 0.5)
    errors.push('Inflation rate out of plausible range (-10% to 50%)');

  // Treated floor area: non-negative (0 is valid, KPIs will be null)
  if (input.treatedFloorArea < 0)
    errors.push('Treated floor area cannot be negative');

  // Energy source index: valid range 1-19
  for (const ei of input.energyInputs) {
    if (ei.energySourceIndex < 1 || ei.energySourceIndex > 19)
      errors.push(
        `Energy source index ${ei.energySourceIndex} out of range (1-19)`,
      );
  }

  // Duplicate endUse check
  const endUses = input.energyInputs.map((ei) => ei.endUse);
  const uniqueEndUses = new Set(endUses);
  if (endUses.length !== uniqueEndUses.size)
    errors.push('Duplicate endUse entries found');

  // EN 15459 component index: valid range 1-79
  for (const sc of input.serviceComponents) {
    if (sc.en15459ComponentIndex < 1 || sc.en15459ComponentIndex > 79)
      errors.push(
        `EN 15459 component index ${sc.en15459ComponentIndex} out of range (1-79)`,
      );
  }

  // Non-negative costs in costItems
  for (const ci of input.costItems) {
    if (ci.materialCost < 0 || ci.laborCost < 0 || ci.otherCost < 0)
      errors.push(`Negative cost found in category ${ci.category}`);
  }

  // Non-negative building element maintenance percentage
  if (input.buildingElementMaintenancePercent < 0)
    errors.push('Building element maintenance percentage cannot be negative');

  return errors;
}

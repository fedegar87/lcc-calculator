import type { CostItemInput, FormulaMode } from './types';
import { CATEGORY_MAINTENANCE_MAP } from './types';

function includeOtherCost(formulaMode: FormulaMode): boolean {
  return formulaMode === 'excel_bugfixed';
}

export function getCostItemConstructionCost(
  costItem: CostItemInput,
  formulaMode: FormulaMode,
): number {
  return (
    costItem.materialCost +
    costItem.laborCost +
    (includeOtherCost(formulaMode) ? costItem.otherCost : 0)
  );
}

export function getTotalConstructionCost(
  costItems: CostItemInput[],
  formulaMode: FormulaMode,
): number {
  return costItems.reduce(
    (sum, costItem) => sum + getCostItemConstructionCost(costItem, formulaMode),
    0,
  );
}

export function getConstructionByCategory(
  costItems: CostItemInput[],
  formulaMode: FormulaMode,
): Record<string, number> {
  const constructionByCategory: Record<string, number> = {};

  for (const costItem of costItems) {
    const existing = constructionByCategory[costItem.category] ?? 0;
    constructionByCategory[costItem.category] =
      existing + getCostItemConstructionCost(costItem, formulaMode);
  }

  return constructionByCategory;
}

export function getBuildingElementConstructionBase(
  costItems: CostItemInput[],
  formulaMode: FormulaMode,
): number {
  return costItems
    .filter(
      (costItem) =>
        CATEGORY_MAINTENANCE_MAP[costItem.category] === 'building_element',
    )
    .reduce(
      (sum, costItem) => sum + getCostItemConstructionCost(costItem, formulaMode),
      0,
    );
}
